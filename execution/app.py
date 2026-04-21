from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import os
import json
import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import email.utils
from config_manager import save_config, load_config
import threading
import time
import requests
import base64
import secrets
import string
from werkzeug.security import generate_password_hash, check_password_hash
from pywebpush import webpush, WebPushException

ALERT_STATE_FILE = 'alert_state.json'

app = Flask(__name__)
# Habilitando CORS para permitir conexões do Frontend do Next.js (rodando em http://localhost:3000)
CORS(app)

@app.route('/api/config/test', methods=['POST'])
def test_connection():
    """
    Testa a conexão com o banco de dados PostgreSQL usando as credenciais informadas.
    Não salva os dados localmente, apenas valida.
    """
    data = request.json
    db_host = data.get('host')
    db_port = data.get('port', 5432)
    db_name = data.get('database')
    db_user = data.get('user')
    db_pass = data.get('password')

    try:
        # Tenta abrir uma conexão teste e fechá-la
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_pass,
            connect_timeout=5
        )
        conn.set_client_encoding('WIN1252')
        conn.close()
        return jsonify({"status": "success", "message": "Conexão com o PostgreSQL realizada com sucesso!"}), 200
        
    except Exception as e:
        return jsonify({"status": "error", "message": f"Erro de conexão: {str(e)}"}), 400


@app.route('/api/config/save', methods=['POST'])
def save_configuration():
    """
    Desabilitado. Configurações devem ser alteradas no painel do servidor Render.
    """
    return jsonify({
        "status": "error", 
        "message": "Configuração manual desabilitada. Utilize as Variáveis de Ambiente no painel (Render) para conectar um banco de dados."
    }), 403


@app.route('/api/config/load', methods=['GET'])
def get_configuration():
    """
    Retorna as configurações existentes se houverem, para preenchimento automático.
    (Senha será enviada em branco no frontend por segurança para evitar exposição na API)
    """
    config = load_config()
    if not config:
        return jsonify({"status": "error", "message": "Nenhuma configuração encontrada."}), 404
        
    # Nunca devolver a senha limpa na API via GET por segurança visual do painel,
    # A não ser que seja um request exigindo descriptografia local pro admin. 
    # Optamos por retonar um placeholder.
    if 'password' in config:
        config['password'] = "********"
        
    return jsonify({"status": "success", "data": config}), 200


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"status": "error", "message": "Usuário e senha são obrigatórios."}), 400

    # 1. Checa conta Admin Local
    ADMIN_USER_HASH = "pbkdf2:sha256:1000000$8X2xYuIIdqSf8Su5$4564cc805e9fe3d0713a6913dd454adf7812e91d518fb00d95499defae0b3e44"
    ADMIN_PASS_HASH = "pbkdf2:sha256:1000000$aC1UI04vySEktWdC$9ba9c11d4e7c82461450f5a6fc87ca3ada7f67dc07112db433e7124df2af4ce5"

    if check_password_hash(ADMIN_USER_HASH, username) and check_password_hash(ADMIN_PASS_HASH, password):
        return jsonify({"status": "success", "role": "admin", "message": "Login Administrador bem-sucedido."})

    # 2. Checa conta Cliente no arquivo local users_config.json
    USERS_CONFIG_FILE = 'users_config.json'
    if os.path.exists(USERS_CONFIG_FILE):
        try:
            with open(USERS_CONFIG_FILE, 'r', encoding='utf-8') as f:
                users_data = json.load(f)
            
            users_list = users_data.get('users', [])
            for user in users_list:
                if user.get('username') == username:
                    # Validar a senha com hash
                    stored_hash = user.get('password')
                    if stored_hash and check_password_hash(stored_hash, password):
                        return jsonify({"status": "success", "role": "client", "message": "Autenticado com sucesso."})
                    
        except Exception as e:
            return jsonify({"status": "error", "message": f"Erro interno ao validar login: {str(e)}"}), 500

    # Se chegou aqui, não autenticou nem como Admin, nem como Cliente
    return jsonify({"status": "error", "message": "Usuário ou senha inválidos."}), 401

@app.route('/api/auth/reset-password', methods=['POST'])
def auth_reset_password():
    data = request.json
    identifier = data.get('identifier')
    
    if not identifier:
        return jsonify({"status": "error", "message": "Informe um usuário ou e-mail."}), 400

    USERS_CONFIG_FILE = 'users_config.json'
    EMAIL_CONFIG_FILE = 'email_config.json'

    if not os.path.exists(USERS_CONFIG_FILE):
        return jsonify({"status": "error", "message": "Nenhum cliente configurado."}), 404

    target_user = None
    users_data = {"users": []}
    
    with open(USERS_CONFIG_FILE, 'r', encoding='utf-8') as f:
        try:
            users_data = json.load(f)
        except Exception:
            pass

    # Procurar usuário pelo username ou email
    for idx, user in enumerate(users_data.get('users', [])):
        if user.get('username') == identifier or user.get('email') == identifier:
            target_user = user
            target_idx = idx
            break

    if not target_user or not target_user.get('email'):
        return jsonify({"status": "error", "message": "Usuário/E-mail não encontrado ou sem e-mail cadastrado."}), 404

    # Gerar senha temporária
    alfabeto = string.ascii_letters + string.digits
    temp_password = ''.join(secrets.choice(alfabeto) for _ in range(8))
    
    # Salvar nova hash
    target_user['password'] = generate_password_hash(temp_password)
    users_data['users'][target_idx] = target_user

    with open(USERS_CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(users_data, f, ensure_ascii=False, indent=4)
        
    sync_file_to_github(USERS_CONFIG_FILE)

    # Disparar E-mail
    if not os.path.exists(EMAIL_CONFIG_FILE):
        return jsonify({"status": "error", "message": "Servidor de e-mail não configurado pelo Administrador."}), 500
        
    try:
        with open(EMAIL_CONFIG_FILE, 'r', encoding='utf-8') as f:
            smtp_cfg = json.load(f)
            
        remetente = smtp_cfg.get('email')
        senha = smtp_cfg.get('password')
        host = smtp_cfg.get('host')
        porta = smtp_cfg.get('port', 587)

        if not remetente or not senha or not host:
            return jsonify({"status": "error", "message": "Configurações de SMTP incompletas."}), 500

        assunto = "[Agente GFC] Redefinição de Senha"
        corpo = f'''
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #334155;">
            <h2>Redefinição de Senha Solicitada</h2>
            <p>Olá, <strong>{target_user.get('username')}</strong>.</p>
            <p>Sua nova senha de acesso temporária foi gerada com sucesso.</p>
            <p style="padding: 12px; background: #f1f5f9; border-radius: 6px; font-size: 18px; font-family: monospace; letter-spacing: 2px;">
                <strong>{temp_password}</strong>
            </p>
            <p>Por favor, acesse o painel GFC e utilize a opção "Alterar senha" na barra lateral para definir sua senha definitiva.</p>
        </div>
        '''

        msg = MIMEMultipart()
        msg['From'] = email.utils.formataddr(('Comercial Informática App', remetente))
        msg['To'] = target_user.get('email')
        msg['Subject'] = assunto
        msg.attach(MIMEText(corpo, 'html'))
        
        if int(porta) == 465:
            server = smtplib.SMTP_SSL(host, int(porta))
            server.login(remetente, senha)
        else:
            server = smtplib.SMTP(host, int(porta))
            server.starttls()
            server.login(remetente, senha)
            
        
        if tipo == 'prevendas':
            send_telegram_alert(f"⚠️ [ALERTA] Temos {len(pendentes)} pré-venda(s) precisando de atenção!")
            send_webpush_alert("Alerta de Pré-Vendas", f"Existem {len(pendentes)} pré-vendas pendentes.")
        elif tipo == 'sincronia':
            send_telegram_alert(f"⚠️ [ALERTA] Temos {len(atrasados)} posto(s) atrasado(s) na sincronia!")
            send_webpush_alert("Alerta de Sincronia", f"Existem {len(atrasados)} postos atrasados.")
            
        server.send_message(msg)
    
        server.quit()

        # Ocultamos a maior parte do email na resposta
        email_parts = target_user.get('email').split('@')
        email_mascarado = email_parts[0][:3] + '***@' + email_parts[1]

        return jsonify({"status": "success", "message": f"Uma senha temporária foi enviada para {email_mascarado}"})
        
    except Exception as e:
        return jsonify({"status": "error", "message": f"Erro ao enviar o e-mail: {str(e)}"}), 500


@app.route('/api/auth/change-password', methods=['POST'])
def auth_change_password():
    data = request.json
    username = data.get('username')
    senha_atual = data.get('senha_atual')
    nova_senha = data.get('nova_senha')

    if not username or not senha_atual or not nova_senha:
        return jsonify({"status": "error", "message": "Todos os campos são obrigatórios."}), 400

    # 1. Tentar alterar para o Admin Local primeiro
    ADMIN_USER_HASH = "pbkdf2:sha256:1000000$8X2xYuIIdqSf8Su5$4564cc805e9fe3d0713a6913dd454adf7812e91d518fb00d95499defae0b3e44"
    ADMIN_PASS_HASH = "scrypt:32768:8:1$rMwYj5bhifNWA0HF$38a54c8415738c6d3e0f63243493fdad76abd4b9d041d867d9b1b2a55f2a1d8769bc3d87c4453f078465380eba08aee1549483a48d15d9a7c1e836f28b539ce9"

    if check_password_hash(ADMIN_USER_HASH, username):
        # A senha do Admin está hardcoded no código (em hash). Não podemos alterá-la via JSON.
        # Avisar ao Admin que a senha dele só pode ser alterada via código-fonte para maior segurança.
        return jsonify({"status": "error", "message": "A senha do Administrador base deve ser alterada diretamente na configuração do sistema por segurança."}), 403

    USERS_CONFIG_FILE = 'users_config.json'
    if not os.path.exists(USERS_CONFIG_FILE):
        return jsonify({"status": "error", "message": "Nenhum cliente configurado."}), 404

    try:
        with open(USERS_CONFIG_FILE, 'r', encoding='utf-8') as f:
            users_data = json.load(f)
            
        users_list = users_data.get('users', [])
        user_found = False
        
        for idx, user in enumerate(users_list):
            if user.get('username') == username:
                user_found = True
                stored_hash = user.get('password')
                if stored_hash and check_password_hash(stored_hash, senha_atual):
                    # Validou, aplicar nova senha
                    users_data['users'][idx]['password'] = generate_password_hash(nova_senha)
                    
                    with open(USERS_CONFIG_FILE, 'w', encoding='utf-8') as f:
                        json.dump(users_data, f, ensure_ascii=False, indent=4)
                        
                    sync_file_to_github(USERS_CONFIG_FILE)
                    return jsonify({"status": "success", "message": "Senha alterada com sucesso!"})
                else:
                    return jsonify({"status": "error", "message": "A senha atual informada está incorreta."}), 401
                    
        if not user_found:
            return jsonify({"status": "error", "message": "Usuário não encontrado."}), 404
                
    except Exception as e:
        return jsonify({"status": "error", "message": f"Erro interno: {str(e)}"}), 500

def sync_file_to_github(filename):
    github_token = os.environ.get('GITHUB_TOKEN')
    github_repo = os.environ.get('GITHUB_REPO')
    
    if not github_token or not github_repo:
        return
        
    try:
        with open(filename, 'rb') as f:
            content = f.read()
        encoded_content = base64.b64encode(content).decode('utf-8')
        
        path_in_repo = f"execution/{filename}"
        url = f"https://api.github.com/repos/{github_repo}/contents/{path_in_repo}"
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        sha = None
        resp_get = requests.get(url, headers=headers)
        if resp_get.status_code == 200:
            sha = resp_get.json().get('sha')
            
        data = {
            "message": f"System: Auto-update {filename} config via GFC App",
            "content": encoded_content
        }
        if sha:
            data["sha"] = sha
            
        def _bg_put():
            try:
                requests.put(url, headers=headers, json=data)
            except:
                pass
        
        threading.Thread(target=_bg_put, daemon=True).start()
    except Exception as e:
        print(f"Erro no GitHub Sync de {filename}: {e}")

VISIBILITY_FILE = 'visibility.json'
SUBSCRIPTIONS_FILE = 'subscriptions.json'

@app.route('/api/config/visibility', methods=['GET'])
def get_visibility():
    if os.path.exists(VISIBILITY_FILE):
        with open(VISIBILITY_FILE, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))
    return jsonify({}) # Retorna vazio, indicando que todos os menus são visíveis por padrão

@app.route('/api/config/visibility', methods=['POST'])
def save_visibility():
    data = request.json
    with open(VISIBILITY_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    sync_file_to_github(VISIBILITY_FILE)
    return jsonify({"status": "success", "message": "Configurações de menus atualizadas."})

USERS_CONFIG_FILE = 'users_config.json'
EMAIL_CONFIG_FILE = 'email_config.json'
ALERTAS_CONFIG_FILE = 'alertas_config.json'

@app.route('/api/config/usuarios', methods=['GET'])
def get_usuarios_config():
    if os.path.exists(USERS_CONFIG_FILE):
        with open(USERS_CONFIG_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Ofuscar as senhas para o frontend
            if 'users' in data:
                for user in data['users']:
                    user['password'] = "********"
            return jsonify({"status": "success", "data": data})
    return jsonify({"status": "success", "data": {"users": []}})

@app.route('/api/config/usuarios', methods=['POST'])
def save_usuarios_config():
    data = request.json
    new_users = data.get('users', [])
    
    # Carregar dados antigos para recuperar a hash se a senha vier ofuscada
    old_data = {"users": []}
    if os.path.exists(USERS_CONFIG_FILE):
        with open(USERS_CONFIG_FILE, 'r', encoding='utf-8') as f:
            try:
                old_data = json.load(f)
            except json.JSONDecodeError:
                pass
                
    old_users_map = {str(u.get('id')): u for u in old_data.get('users', [])}
    
    for user in new_users:
        uid = str(user.get('id'))
        if user.get('password') == "********":
            # Mantém a hash antiga
            if uid in old_users_map:
                user['password'] = old_users_map[uid].get('password', '')
            else:
                user['password'] = '' # Fallback caso envie ofuscado mas não exista (não deve ocorrer)
        elif user.get('password'):
            # Gera nova hash
            user['password'] = generate_password_hash(user['password'])

    with open(USERS_CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump({"users": new_users}, f, ensure_ascii=False, indent=4)
        
    sync_file_to_github(USERS_CONFIG_FILE)
    return jsonify({"status": "success", "message": "Usuários salvos com sucesso."})

@app.route('/api/config/email', methods=['GET'])
def get_email_config():
    if os.path.exists(EMAIL_CONFIG_FILE):
        with open(EMAIL_CONFIG_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Retorna dados, omitindo/ofuscando a senha se desejar para proteção
            if 'password' in data and data['password']:
                data['password'] = "********"
            return jsonify({"status": "success", "data": data})
    return jsonify({"status": "success", "data": {}})

@app.route('/api/config/email', methods=['POST'])
def save_email_config():
    data = request.json
    
    # Se a senha vier ofuscada não sobrescreve a original
    if data.get('password') == "********" and os.path.exists(EMAIL_CONFIG_FILE):
        with open(EMAIL_CONFIG_FILE, 'r', encoding='utf-8') as f:
            old_data = json.load(f)
            data['password'] = old_data.get('password', '')

    with open(EMAIL_CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    sync_file_to_github(EMAIL_CONFIG_FILE)
    return jsonify({"status": "success", "message": "Configurações de E-mail salvas."})

@app.route('/api/config/alertas', methods=['GET'])
def get_alertas_config():
    if os.path.exists(ALERTAS_CONFIG_FILE):
        with open(ALERTAS_CONFIG_FILE, 'r', encoding='utf-8') as f:
            return jsonify({"status": "success", "data": json.load(f)})
    return jsonify({"status": "success", "data": {}})


@app.route('/api/notifications/vapidPublicKey', methods=['GET'])
def get_vapid_public_key():
    public_key = os.environ.get('VAPID_PUBLIC_KEY')
    if public_key:
        return jsonify({"status": "success", "publicKey": public_key})
    return jsonify({"status": "error", "message": "VAPID key not configured as environment variable"}), 500

@app.route('/api/notifications/subscribe', methods=['POST'])
def subscribe_notification():
    subscription = request.json
    if not subscription:
        return jsonify({"status": "error", "message": "Dados inválidos."}), 400
        
    subs = []
    if os.path.exists(SUBSCRIPTIONS_FILE):
        try:
            with open(SUBSCRIPTIONS_FILE, 'r', encoding='utf-8') as f:
                subs = json.load(f)
        except:
            pass
            
    exists = False
    for s in subs:
        if s.get('endpoint') == subscription.get('endpoint'):
            exists = True
            break
            
    if not exists:
        subs.append(subscription)
        with open(SUBSCRIPTIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump(subs, f, indent=4)
        sync_file_to_github(SUBSCRIPTIONS_FILE)
        
    return jsonify({"status": "success", "message": "Inscrição realizada."})

@app.route('/api/config/alertas', methods=['POST'])
def save_alertas_config():
    data = request.json
    with open(ALERTAS_CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    sync_file_to_github(ALERTAS_CONFIG_FILE)
    return jsonify({"status": "success", "message": "Configurações de Alertas salvas."})


@app.route('/api/monitoramento/prevendas', methods=['GET'])
def get_prevendas():
    config = load_config()
    if not config:
        return jsonify({"status": "error", "message": "Sistema não configurado."}), 400

    try:
        conn = psycopg2.connect(
            host=config['host'],
            port=config.get('port', 5432),
            database=config['database'],
            user=config['user'],
            password=config['password'],
            connect_timeout=10
        )
        conn.set_client_encoding('WIN1252')
        cursor = conn.cursor()
        
        # Consulta SQL aprovada pelo usuário - Extrai dados do Orçamento fazendo Join na Empresa (Para expor nome fantasia visualmente na tabela)
        cursor.execute("""
            SELECT o.*, e.nome as nome_empresa 
            FROM orcamento o 
            LEFT JOIN empresa e ON o.empresa = e.grid 
            WHERE o.status = 'A' AND o.tipo = 'S' AND o.obs IS NOT NULL 
            AND ABS(EXTRACT(EPOCH FROM (o.hora - NOW()))) > 3600
        """)
        
        # Construtor dinâmico para pegar qualquer coluna retornada e montar em JSON limpo e legível
        columns = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor.fetchall():
            row_dict = dict(zip(columns, row))
            # Converte objetos complexos que não vão automaticamente para JSON nativo (Datetime e Decimal)
            for k, v in row_dict.items():
                if isinstance(v, datetime.datetime) or isinstance(v, datetime.date):
                    row_dict[k] = v.strftime("%Y-%m-%d %H:%M:%S")
                elif hasattr(v, 'quantize') or type(v).__name__ == 'Decimal': # Para checar Decimal sem importar bibliotecas pesadas extra
                    row_dict[k] = float(v)
            results.append(row_dict)
            
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "data": results})
        
    except psycopg2.Error as e:
        error_msg = str(e).lower()
        if "timeout" in error_msg or "could not connect to server" in error_msg or "tempo limite" in error_msg:
            return jsonify({"status": "timeout", "message": "Aguarde um momento, a conexão do banco esta demorando um pouco mais do que o normal."}), 504
        return jsonify({"status": "error", "message": "Erro de consulta SQL no Banco: " + str(e)}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/monitoramento/sincronia', methods=['GET'])
def get_sincronia():
    config = load_config()
    if not config:
        return jsonify({"status": "error", "message": "Sistema não configurado."}), 400

    try:
        conn = psycopg2.connect(
            host=config['host'],
            port=config.get('port', 5432),
            database=config['database'],
            user=config['user'],
            password=config['password'],
            connect_timeout=10
        )
        conn.set_client_encoding('WIN1252')
        cursor = conn.cursor()
        
        # Monitora a divergência entre Último Avanço (ts) e o Recebimento/Envio (sync_last_update)
        # Se ultrapassar 30 min (1800 s), o alerta de Status ganha "True" para ativar os Triângulos.
        cursor.execute("""
            SELECT 
                s.sid,
                e.nome as servidor,
                s.ts as ultimo_avanco,
                s.sync_last_update as ultimo_recebimento,
                s.gfid as posicao,
                CASE WHEN ABS(EXTRACT(EPOCH FROM (s.sync_last_update - s.ts))) > 1800 
                     THEN true 
                     ELSE false 
                END as is_delayed
            FROM pgd_flow_sync s
            LEFT JOIN empresa e ON s.sid::varchar = e.codigo::varchar
            ORDER BY is_delayed DESC, s.ts ASC
        """)
        
        columns = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor.fetchall():
            row_dict = dict(zip(columns, row))
            for k, v in row_dict.items():
                if isinstance(v, datetime.datetime) or isinstance(v, datetime.date):
                    row_dict[k] = v.strftime("%Y-%m-%d %H:%M:%S")
                elif hasattr(v, 'quantize') or type(v).__name__ == 'Decimal':
                    row_dict[k] = float(v)
            results.append(row_dict)
            
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "data": results})
        
    except psycopg2.Error as e:
        error_msg = str(e).lower()
        if "timeout" in error_msg or "could not connect to server" in error_msg or "tempo limite" in error_msg:
            return jsonify({"status": "timeout", "message": "Aguarde um momento, a conexão do banco esta demorando um pouco mais do que o normal."}), 504
        return jsonify({"status": "error", "message": "Erro de consulta SQL no Banco: " + str(e)}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def send_telegram_alert(mensagem):
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID')
    if not token or not chat_id:
        return
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {"chat_id": chat_id, "text": mensagem}
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        print("Erro Telegram:", e)

def send_webpush_alert(titulo, mensagem):
    if not os.path.exists(SUBSCRIPTIONS_FILE):
        return
        
    vapid_private_key = os.environ.get('VAPID_PRIVATE_KEY')
    if not vapid_private_key:
        return
        
    try:
            
        with open(SUBSCRIPTIONS_FILE, 'r', encoding='utf-8') as f:
            subs = json.load(f)
            
        claims = {"sub": "mailto:admin@appgfc.com.br"}
        payload = json.dumps({"title": titulo, "body": mensagem})
        
        valid_subs = []
        changed = False
        for sub in subs:
            try:
                webpush(
                    subscription_info=sub,
                    data=payload,
                    vapid_private_key=vapid_private_key,
                    vapid_claims=claims
                )
                valid_subs.append(sub)
            except WebPushException as ex:
                if ex.response and ex.response.status_code in [404, 410]:
                    changed = True
                else:
                    valid_subs.append(sub)
                    print("Erro Push:", ex)
            except Exception as e:
                valid_subs.append(sub)
                    
        if changed:
            with open(SUBSCRIPTIONS_FILE, 'w', encoding='utf-8') as f:
                json.dump(valid_subs, f, indent=4)
            sync_file_to_github(SUBSCRIPTIONS_FILE)
            
    except Exception as e:
        print("Erro WebPush Geral:", e)

def executar_disparo_alerta(tipo, force_send=False):
    # 1. Checa as configurações do E-mail e dos Destinatários
    if not os.path.exists(EMAIL_CONFIG_FILE) or not os.path.exists(ALERTAS_CONFIG_FILE):
        return False, "E-mails ou Servidor SMTP não configurados.", False
        
    with open(EMAIL_CONFIG_FILE, 'r', encoding='utf-8') as f:
        smtp_cfg = json.load(f)
    with open(ALERTAS_CONFIG_FILE, 'r', encoding='utf-8') as f:
        alerta_cfg = json.load(f)
        
    remetente = smtp_cfg.get('email')
    senha = smtp_cfg.get('password')
    host = smtp_cfg.get('host')
    porta = smtp_cfg.get('port', 587)
    
    destinatarios_str = alerta_cfg.get('emails', '')
    if not remetente or not senha or not host or not destinatarios_str:
        return False, "Configurações de E-mail incompletas.", False

    destinatarios_str = destinatarios_str.replace(',', ';')
    destinatarios = [e.strip() for e in destinatarios_str.split(';') if e.strip()]
    
    if len(destinatarios) == 0:
        return False, "E-mails destinatários formatados incorretamente ou em branco.", False
    
    try:
        if tipo == 'prevendas':
            # Vamos usar um context local para chamar a func isolada já que ela retorna jsonify
            # Ao invés de usar get_prevendas(), podemos refatorar para chamar a rotina core.
            # Mas, como get_prevendas() retorna Flask Responde, chama a via requests locale? Não,
            # Melhor refatorar pegando os dados diretos do banco.
            config = load_config()
            conn = psycopg2.connect(
                host=config['host'], port=config.get('port', 5432),
                database=config['database'], user=config['user'], password=config['password']
            )
            conn.set_client_encoding('WIN1252')
            cursor = conn.cursor()
            cursor.execute("""
                SELECT o.*, e.nome as nome_empresa 
                FROM orcamento o 
                LEFT JOIN empresa e ON o.empresa = e.grid 
                WHERE o.status = 'A' AND o.tipo = 'S' AND o.obs IS NOT NULL 
                AND ABS(EXTRACT(EPOCH FROM (o.hora - NOW()))) > 3600
            """)
            columns = [desc[0] for desc in cursor.description]
            pendentes = []
            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))
                for k, v in row_dict.items():
                    if isinstance(v, datetime.datetime) or isinstance(v, datetime.date):
                        row_dict[k] = v.strftime("%Y-%m-%d %H:%M:%S")
                    elif hasattr(v, 'quantize') or type(v).__name__ == 'Decimal':
                        row_dict[k] = float(v)
                pendentes.append(row_dict)
            cursor.close()
            conn.close()

            if len(pendentes) == 0 and not force_send:
                return True, "Nenhuma pendência, e-mail não enviado.", False

            assunto = "[Agente GFC] Alerta de Pré-vendas Pendentes"
            
            def format_curr(val):
                if val is None or val == 'None': return 'R$ 0,00'
                try: return f"R$ {float(val):,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
                except: return str(val)

            rows_html = ""
            for i, row in enumerate(pendentes):
                bg = "#ffffff" if i % 2 == 0 else "#f8fafc"
                rows_html += f'''
                <tr style="border-bottom: 1px solid #e2e8f0; background: {bg};">
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">{row.get('nome_empresa', '')}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0; font-weight: bold;">{row.get('numero', '')}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">{row.get('hora', '')}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">{row.get('placa', '') or ''}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">{row.get('cliente', '') or ''}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">{format_curr(row.get('valor'))}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">{row.get('pagamento', '')}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">{str(row.get('vendedor', '') or '').upper()}</td>
                </tr>
                '''

            corpo = f'''
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; padding: 20px; color: #334155;">
                <div style="max-width: 900px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="color: #ef4444; margin-top: 0; font-size: 22px;">Monitoramento de Pré-Vendas</h2>
                    <p style="font-size: 15px; margin-bottom: 24px;">O robô detectou <strong>{len(pendentes)}</strong> registro(s) pendente(s) que precisam de atenção.</p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #cbd5e1;">
                        <thead>
                            <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
                                <th style="padding: 12px 10px; border-right: 1px solid #cbd5e1;">Empresa</th>
                                <th style="padding: 12px 10px; border-right: 1px solid #cbd5e1;">Número</th>
                                <th style="padding: 12px 10px; border-right: 1px solid #cbd5e1;">Data/Hora</th>
                                <th style="padding: 12px 10px; border-right: 1px solid #cbd5e1;">Placa</th>
                                <th style="padding: 12px 10px; border-right: 1px solid #cbd5e1;">Cliente</th>
                                <th style="padding: 12px 10px; border-right: 1px solid #cbd5e1;">Valor</th>
                                <th style="padding: 12px 10px; border-right: 1px solid #cbd5e1;">Pagamento</th>
                                <th style="padding: 12px 10px; border-right: 1px solid #cbd5e1;">Vendedor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows_html if rows_html else '<tr><td colspan="8" style="padding: 24px; text-align: center;">Nenhuma pré-venda pendente no momento.</td></tr>'}
                        </tbody>
                    </table>
                    <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">Email automático enviado pelo Agente GFC.</p>
                </div>
            </div>
            '''
            
        elif tipo == 'sincronia':
            config = load_config()
            conn = psycopg2.connect(
                host=config['host'], port=config.get('port', 5432),
                database=config['database'], user=config['user'], password=config['password']
            )
            conn.set_client_encoding('WIN1252')
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    s.sid,
                    e.nome as servidor,
                    s.ts as ultimo_avanco,
                    s.sync_last_update as ultimo_recebimento,
                    s.gfid as posicao,
                    CASE WHEN ABS(EXTRACT(EPOCH FROM (s.sync_last_update - s.ts))) > 1800 
                         THEN true 
                         ELSE false 
                    END as is_delayed
                FROM pgd_flow_sync s
                LEFT JOIN empresa e ON s.sid::varchar = e.codigo::varchar
                ORDER BY is_delayed DESC, s.ts ASC
            """)
            columns = [desc[0] for desc in cursor.description]
            data_res = []
            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))
                for k, v in row_dict.items():
                    if isinstance(v, datetime.datetime) or isinstance(v, datetime.date):
                        row_dict[k] = v.strftime("%Y-%m-%d %H:%M:%S")
                    elif hasattr(v, 'quantize') or type(v).__name__ == 'Decimal':
                        row_dict[k] = float(v)
                data_res.append(row_dict)
            cursor.close()
            conn.close()

            atrasados = [item for item in data_res if item.get('is_delayed')]

            if len(atrasados) == 0 and not force_send:
                return True, "Nenhuma pendência, e-mail não enviado.", False

            assunto = "[Agente GFC] Alerta de Atraso na Sincronia de Filiais"
            
            def format_dt(dt_str):
                if not dt_str or dt_str == 'None': return dt_str
                try:
                    d = datetime.datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')
                    return d.strftime('%d/%m/%Y, %H:%M')
                except: return dt_str

            rows_html = ""
            for item in atrasados:
                sid = item.get('sid', '')
                posto = item.get('servidor', '') or ''
                ult_av = format_dt(item.get('ultimo_avanco', ''))
                ult_rec = format_dt(item.get('ultimo_recebimento', ''))
                pos = item.get('posicao', '')
                
                rows_html += f'''
                <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; text-align: center; color: #eab308; font-size: 16px;">&#9888;&#65039;</td>
                    <td style="padding: 12px; font-weight: bold; border-right: 1px solid #e2e8f0;">{sid}</td>
                    <td style="padding: 12px; color: #475569; border-right: 1px solid #e2e8f0;">{posto}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0;">{ult_av}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0;">{ult_rec}</td>
                    <td style="padding: 12px; font-weight: 500;">{pos}</td>
                </tr>
                '''

            corpo = f'''
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; padding: 20px; color: #334155;">
                <div style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="color: #d97706; margin-top: 0; font-size: 22px;">Monitoramento de Sincronia</h2>
                    <p style="font-size: 15px; margin-bottom: 24px;">Temos <strong>{len(atrasados)}</strong> posto(s) atrasado(s) na rede.</p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #cbd5e1;">
                        <thead>
                            <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
                                <th style="padding: 12px; width: 40px; border-right: 1px solid #cbd5e1;"></th>
                                <th style="padding: 12px; border-right: 1px solid #cbd5e1;">Sid</th>
                                <th style="padding: 12px; border-right: 1px solid #cbd5e1;">Posto</th>
                                <th style="padding: 12px; border-right: 1px solid #cbd5e1;">Último Avanço</th>
                                <th style="padding: 12px; border-right: 1px solid #cbd5e1;">Último Receb./Envio</th>
                                <th style="padding: 12px;">Posição</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows_html if rows_html else '<tr><td colspan="6" style="padding: 24px; text-align: center;">Nenhum posto atrasado.</td></tr>'}
                        </tbody>
                    </table>
                    <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">Email automático enviado pelo Agente GFC.</p>
                </div>
            </div>
            '''
        else:
            return False, "Tipo de monitoramento não reconhecido.", False

        msg = MIMEMultipart()
        msg['From'] = email.utils.formataddr(('Comercial Informática App', remetente))
        msg['To'] = ", ".join(destinatarios)
        msg['Subject'] = assunto
        
        msg.attach(MIMEText(corpo, 'html'))
        
        if int(porta) == 465:
            server = smtplib.SMTP_SSL(host, int(porta))
            server.login(remetente, senha)
        else:
            server = smtplib.SMTP(host, int(porta))
            server.starttls()
            server.login(remetente, senha)
            
        
        if tipo == 'prevendas':
            send_telegram_alert(f"⚠️ [ALERTA] Temos {len(pendentes)} pré-venda(s) precisando de atenção!")
            send_webpush_alert("Alerta de Pré-Vendas", f"Existem {len(pendentes)} pré-vendas pendentes.")
        elif tipo == 'sincronia':
            send_telegram_alert(f"⚠️ [ALERTA] Temos {len(atrasados)} posto(s) atrasado(s) na sincronia!")
            send_webpush_alert("Alerta de Sincronia", f"Existem {len(atrasados)} postos atrasados.")
            
        server.send_message(msg)
    
        server.quit()
        
        return True, f"Alerta enviado para {len(destinatarios)} destinatário(s)!", True
        
    except smtplib.SMTPAuthenticationError:
        print("Erro Crítico de Envio SMTP: Autenticação falhou. Usuário ou senha incorretos/bloqueados.")
        return False, "Erro de Autenticação no SMTP (Verifique a Senha de Aplicativo ou liberação do provedor).", False
    except Exception as e:
        print(f"Erro Crítico de Envio SMTP GERAL: {str(e)}")
        return False, f"Erro ao processar disparo de e-mail: {str(e)}", False

class AlertManager:
    def __init__(self):
        self.state = {"prevendas": False, "sincronia": False}
        self.threads = {"prevendas": None, "sincronia": None}
        self.failing_state = {"prevendas": False, "sincronia": False}
        self.load_state()

    def load_state(self):
        if os.path.exists(ALERT_STATE_FILE):
            try:
                with open(ALERT_STATE_FILE, 'r', encoding='utf-8') as f:
                    self.state = json.load(f)
            except:
                pass
        
        # Recuperando estado persistente e reiniciando as threads se necessário
        if self.state.get("prevendas"):
            self._spawn_thread("prevendas")
        if self.state.get("sincronia"):
            self._spawn_thread("sincronia")

    def save_state(self):
        with open(ALERT_STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.state, f)
        sync_file_to_github(ALERT_STATE_FILE)

    def set_estado(self, tipo, status, skip_first=False):
        if tipo not in ["prevendas", "sincronia"]:
            return

        # Para interromper
        if not status:
            self.state[tipo] = False
            self.save_state()
            return

        # Para Iniciar
        if status and not self.state[tipo]:
            self.state[tipo] = True
            self.save_state()
            self._spawn_thread(tipo, skip_first)

    def _spawn_thread(self, tipo, skip_first=False):
        self.threads[tipo] = threading.Thread(target=self._loop, args=(tipo, skip_first), daemon=True)
        self.threads[tipo].start()

    def _is_active(self, tipo):
        if os.path.exists(ALERT_STATE_FILE):
            try:
                with open(ALERT_STATE_FILE, 'r', encoding='utf-8') as f:
                    st = json.load(f)
                    return st.get(tipo, False)
            except:
                pass
        return False

    def _loop(self, tipo, skip_first=False):
        if skip_first:
            for _ in range(900):
                if not self._is_active(tipo):
                    break
                time.sleep(1)

        while self._is_active(tipo):
            try:
                # Com is_background, processa e-mail apenas se pendentes > 0.
                sucesso, msg, has_errors = executar_disparo_alerta(tipo, force_send=False)
                
                was_failing = self.failing_state.get(tipo, False)
                if has_errors:
                    self.failing_state[tipo] = True
                elif was_failing and not has_errors:
                    self.failing_state[tipo] = False
                    # DISPARAR ALERTA DE ERRO SANADO!
                    nome_tipo = "Pré-vendas" if tipo == 'prevendas' else "Sincronia"
                    send_telegram_alert(f"✅ [ERRO SANADO] O problema de {nome_tipo} foi resolvido!")
                    send_webpush_alert("Erro Sanado", f"O problema de {nome_tipo} foi resolvido!")
            except Exception as e:
                print(f"Erro na thread de monitoramento ({tipo}): {e}")
            
            # Pausa de 15 minutos checando interrupção a cada 1 segundo
            for _ in range(900):
                if not self._is_active(tipo):
                    break
                time.sleep(1)

# Inicia o gerenciador de Alertas que tentará recuperar os status antigos
alert_manager = AlertManager()

@app.route('/api/monitoramento/disparar-alerta', methods=['POST'])
def disparar_alerta():
    data = request.json
    tipo = data.get('tipo', '')
    sucesso, msg, _ = executar_disparo_alerta(tipo, force_send=True)
    if sucesso:
        return jsonify({"status": "success", "message": msg})
    else:
        return jsonify({"status": "error", "message": msg}), 400

@app.route('/api/monitoramento/status-rotina', methods=['GET'])
def status_rotina():
    tipo = request.args.get('tipo', '')
    if tipo in alert_manager.state:
        return jsonify({"status": "success", "ativo": alert_manager.state[tipo]})
    return jsonify({"status": "error", "message": "Tipo desconhecido."}), 400

@app.route('/api/monitoramento/toggle-rotina', methods=['POST'])
def toggle_rotina():
    data = request.json
    tipo = data.get('tipo', '')
    ativo = data.get('ativo', False)
    
    if tipo in alert_manager.state:
        if ativo:
            # Validação pró-ativa das configurações antes de dar start na thread de alertas
            if not os.path.exists(EMAIL_CONFIG_FILE) or not os.path.exists(ALERTAS_CONFIG_FILE):
                return jsonify({"status": "error", "message": "Por favor, cadastre primeiro as Informações do Cliente e as Configurações de E-Mail do Aplicativo."}), 400
                
            with open(ALERTAS_CONFIG_FILE, 'r', encoding='utf-8') as f:
                try:
                    alerta_cfg = json.load(f)
                except json.JSONDecodeError:
                    alerta_cfg = {}
            if not alerta_cfg.get('emails') or not alerta_cfg.get('emails').strip():
                return jsonify({"status": "error", "message": "Nenhum e-mail de destinatário foi cadastrado na tela de Inf. Clientes. Não é possível iniciar alertas sem um destino."}), 400
            
            with open(EMAIL_CONFIG_FILE, 'r', encoding='utf-8') as f:
                try:
                    email_cfg = json.load(f)
                except json.JSONDecodeError:
                    email_cfg = {}
            if not email_cfg.get('email') or not email_cfg.get('password') or not email_cfg.get('host'):
                return jsonify({"status": "error", "message": "O remetente do GFC (E-mail, Senha ou Host) não foi configurado corretamente na aba de 'Conf. Email Aplicativo'."}), 400

            # Realiza um teste imadiato disparando o email
            sucesso, msg, _ = executar_disparo_alerta(tipo, force_send=True)
            if not sucesso:
                return jsonify({"status": "error", "message": f"Falha no envio do alerta de teste: {msg}"}), 400

            alert_manager.set_estado(tipo, ativo, skip_first=True)
            estado_str = "iniciada"
            return jsonify({"status": "success", "message": f"Rotina iniciada com sucesso! Alerta de teste enviado: {msg}", "ativo": ativo})
        else:
            alert_manager.set_estado(tipo, ativo)
            estado_str = "finalizada"
            return jsonify({"status": "success", "message": f"Rotina de {tipo} {estado_str} com sucesso!", "ativo": ativo})
    
    return jsonify({"status": "error", "message": "Tipo de rotina indisponível."}), 400

@app.route('/api/empresas', methods=['GET'])
def get_empresas():
    config = load_config()
    if not config:
        return jsonify({"status": "error", "message": "Sistema não configurado."}), 400

    try:
        conn = psycopg2.connect(
            host=config['host'],
            port=config.get('port', 5432),
            database=config['database'],
            user=config['user'],
            password=config['password']
        )
        conn.set_client_encoding('WIN1252')
        cursor = conn.cursor()
        
        cursor.execute("SELECT grid as codigo, nome_reduzido as empresa FROM empresa ORDER BY nome_reduzido")
        columns = [desc[0] for desc in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return jsonify({"status": "success", "data": results})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/relatorios/transacoes-pos', methods=['POST'])
def get_transacoes_pos():
    data = request.json
    dt_periodo_ini = data.get('data_inicial')
    dt_periodo_fim = data.get('data_final')
    empresa = data.get('codigo_empresa')

    if not all([dt_periodo_ini, dt_periodo_fim, empresa]):
        return jsonify({"status": "error", "message": "Data inicial, data final e empresa são obrigatórios."}), 400

    config = load_config()
    if not config:
        return jsonify({"status": "error", "message": "Sistema não configurado."}), 400

    try:
        conn = psycopg2.connect(
            host=config['host'], port=config.get('port', 5432),
            database=config['database'], user=config['user'], password=config['password']
        )
        conn.set_client_encoding('WIN1252')
        cursor = conn.cursor()
        
        query = """
            SELECT
              mm.conta_debitar as plano_conta,
              mm.nome as forma_pagamento, 
              m.data,
              m.turno,
              c.nome as conta_caixa,
              m.valor, 
              m.documento,
              m.usuario,
              nf.numero_nota,
              e.nome_reduzido as empresa
            FROM movto m
            JOIN motivo_movto mm ON (mm.grid = m.motivo)
            LEFT JOIN conta c ON (c.codigo=m.conta_creditar)
            LEFT JOIN nota_fiscal nf ON (nf.mlid=m.mlid)
            LEFT JOIN empresa e ON (e.grid=m.empresa)
            WHERE mm.forma_pgto = 't'
              AND mm.conta_debitar ILIKE '1.3.01%%'
              AND NOT EXISTS (SELECT 1 FROM tef_transacao t WHERE t.movto = m.grid)
              AND m.data BETWEEN %s AND %s
              AND e.grid = %s
            ORDER BY m.documento
        """
        cursor.execute(query, (dt_periodo_ini, dt_periodo_fim, empresa))
        
        columns = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor.fetchall():
            row_dict = dict(zip(columns, row))
            for k, v in row_dict.items():
                if isinstance(v, (datetime.datetime, datetime.date)):
                    row_dict[k] = v.strftime("%Y-%m-%d %H:%M:%S")
                elif hasattr(v, 'quantize') or type(v).__name__ == 'Decimal':
                    row_dict[k] = float(v)
            results.append(row_dict)
            
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "data": results})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Erro de banco: {str(e)}"}), 500

@app.route('/api/relatorios/transacoes-duplicadas', methods=['POST'])
def get_transacoes_duplicadas():
    data = request.json
    dt_periodo_ini = data.get('data_inicial')
    dt_periodo_fim = data.get('data_final')
    empresa = data.get('codigo_empresa')

    if not all([dt_periodo_ini, dt_periodo_fim, empresa]):
        return jsonify({"status": "error", "message": "Data inicial, data final e empresa são obrigatórios."}), 400

    config = load_config()
    if not config:
        return jsonify({"status": "error", "message": "Sistema não configurado."}), 400

    try:
        conn = psycopg2.connect(
            host=config['host'], port=config.get('port', 5432),
            database=config['database'], user=config['user'], password=config['password']
        )
        conn.set_client_encoding('WIN1252')
        cursor = conn.cursor()
        
        query = """
SELECT
    mm.conta_debitar,
    mm.nome AS nome_cartao,
    m.data,
    m.turno,
    c.nome AS nome_caixa,
    m.documento,
    m.vencto,
    nf.numero_nota,
    nfts.nome AS status,
    m.valor,
    m.usuario,
    e.nome_reduzido AS nome_empresa,
    CASE 
        WHEN tt.autorizacao IS NOT NULL THEN tt.autorizacao 
        ELSE 'Sem Autorização TEF' 
    END AS autorizacao_tef
FROM movto m
INNER JOIN motivo_movto AS mm ON m.motivo = mm.grid
LEFT JOIN empresa AS e ON e.grid = m.empresa
LEFT JOIN conta AS c ON m.conta_creditar = c.codigo
LEFT JOIN tef_transacao AS tt ON m.grid = tt.movto
LEFT JOIN nota_fiscal AS nf ON nf.mlid = m.mlid
LEFT JOIN nota_fiscal_situacao AS nfs ON nf.grid = nfs.nota_fiscal
LEFT JOIN nota_fiscal_tipo_situacao AS nfts ON nfs.situacao = nfts.codigo
INNER JOIN (
    SELECT
        SPLIT_PART(sub_m.documento, '/', 1) AS documento_base,
        sub_m.data
    FROM movto sub_m
    INNER JOIN motivo_movto sub_mm ON sub_m.motivo = sub_mm.grid
    LEFT JOIN empresa e2 ON e2.grid = sub_m.empresa
    WHERE sub_m.data BETWEEN %s AND %s
      AND sub_mm.forma_pgto = 't'
      AND sub_mm.conta_debitar ILIKE '1.3.01%%'
      AND sub_mm.nome NOT LIKE '%%PARCELADO%%'
      AND e2.grid = %s
    GROUP BY SPLIT_PART(sub_m.documento, '/', 1), sub_m.data
    HAVING COUNT(*) > 1
) AS Duplicates 
ON SPLIT_PART(m.documento, '/', 1) = Duplicates.documento_base AND m.data = Duplicates.data
WHERE m.data BETWEEN %s AND %s
  AND mm.forma_pgto = 't'
  AND mm.conta_debitar ILIKE '1.3.01%%'
  AND mm.nome NOT LIKE '%%PARCELADO%%'
  AND e.grid = %s
  AND (nf.grid IS NULL OR nfs.situacao = 310)
ORDER BY m.data, SPLIT_PART(m.documento, '/', 1)
        """
        # A querie leva 6 parâmetros devido à repetição de dates e empresa na subquery
        params = (dt_periodo_ini, dt_periodo_fim, empresa, dt_periodo_ini, dt_periodo_fim, empresa)
        cursor.execute(query, params)
        
        columns = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor.fetchall():
            row_dict = dict(zip(columns, row))
            for k, v in row_dict.items():
                if isinstance(v, (datetime.datetime, datetime.date)):
                    row_dict[k] = v.strftime("%Y-%m-%d")
                elif hasattr(v, 'quantize') or type(v).__name__ == 'Decimal':
                    row_dict[k] = float(v)
            results.append(row_dict)
            
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "data": results})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Erro de banco: {str(e)}"}), 500

if __name__ == '__main__':
    # Roda o servidor de Agent/API local na porta 5000 em modo de desenvolvimento
    app.run(host='0.0.0.0', debug=True, port=5000)
