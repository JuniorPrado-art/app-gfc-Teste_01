import json
import os
from security import encrypt_data, decrypt_data

CONFIG_FILE = "config.json"

def save_config(config_data):
    """
    Salva as configurações (CNPJ, Nome, Host, User, Pass), criptografando a senha.
    """
    # Clona do dict original para não afetar o runtime
    safe_config = config_data.copy()
    
    if "password" in safe_config and safe_config["password"]:
        safe_config["password"] = encrypt_data(safe_config["password"])
        
    with open(CONFIG_FILE, "w", encoding="utf-8") as file:
        json.dump(safe_config, file, indent=4)
    return True

def load_config():
    """
    Carrega e descriptografa a senha para ser usada pela API Interna.
    """
    if not os.path.exists(CONFIG_FILE):
        return None
        
    with open(CONFIG_FILE, "r", encoding="utf-8") as file:
        config_data = json.load(file)
        
    if "password" in config_data and config_data["password"]:
        config_data["password"] = decrypt_data(config_data["password"])
        
    return config_data
