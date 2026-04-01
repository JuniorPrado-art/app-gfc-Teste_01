import os

def save_config(config_data):
    """
    Desabilitado para Cloud.
    Configurações devem ser alteradas no painel do servidor Render.
    """
    return False

def load_config():
    """
    Lê as configurações de banco de dados diretamente das Variáveis de Ambiente do Render.
    Se a variável DB_HOST não existir, consideramos que o banco não está configurado.
    """
    if not os.environ.get('DB_HOST'):
        return None
        
    return {
        "nome_base": os.environ.get('CLIENT_NAME', 'Template App GFC'),
        "host": os.environ.get('DB_HOST'),
        "port": os.environ.get('DB_PORT', '5432'),
        "database": os.environ.get('DB_NAME'),
        "user": os.environ.get('DB_USER'),
        "password": os.environ.get('DB_PASS')
    }
