import os
import json

CLIENTES_CONFIG_FILE = 'clientes_config.json'

def load_client_config(alias):
    """
    Lê as configurações do cliente específico a partir do arquivo clientes_config.json
    """
    if not os.path.exists(CLIENTES_CONFIG_FILE):
        return None
        
    try:
        with open(CLIENTES_CONFIG_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            clientes = data.get('clientes', [])
            for cli in clientes:
                if cli.get('alias') == alias:
                    return {
                        "nome_base": cli.get('CLIENT_NAME', alias),
                        "host": cli.get('DB_HOST'),
                        "port": cli.get('DB_PORT', '5432'),
                        "database": cli.get('DB_NAME'),
                        "user": cli.get('DB_USER'),
                        "password": cli.get('DB_PASS'),
                        "emails": cli.get('emails'),
                        "TELEGRAM_BOT_TOKEN": cli.get('TELEGRAM_BOT_TOKEN'),
                        "TELEGRAM_CHAT_ID": cli.get('TELEGRAM_CHAT_ID'),
                        "VAPID_PUBLIC_KEY": cli.get('VAPID_PUBLIC_KEY'),
                        "VAPID_PRIVATE_KEY": cli.get('VAPID_PRIVATE_KEY')
                    }
    except Exception as e:
        print("Erro ao carregar config do cliente:", e)
        
    return None

def get_all_clients():
    """Retorna a lista completa de clientes configurados."""
    if not os.path.exists(CLIENTES_CONFIG_FILE):
        return []
    try:
        with open(CLIENTES_CONFIG_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('clientes', [])
    except:
        return []

