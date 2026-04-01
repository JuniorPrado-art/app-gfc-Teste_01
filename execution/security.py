import os
from cryptography.fernet import Fernet

KEY_FILE = "secret.key"

def load_or_generate_key():
    """Carrega a chave existente ou gera uma nova caso não exista."""
    if not os.path.exists(KEY_FILE):
        key = Fernet.generate_key()
        with open(KEY_FILE, "wb") as key_file:
            key_file.write(key)
    else:
        with open(KEY_FILE, "rb") as key_file:
            key = key_file.read()
    return key

# Instância do Fernet para criptografia baseada na chave local
f = Fernet(load_or_generate_key())

def encrypt_data(data: str) -> str:
    """Criptografa uma string."""
    if not data:
        return data
    encrypted = f.encrypt(data.encode('utf-8'))
    return encrypted.decode('utf-8')

def decrypt_data(encrypted_data: str) -> str:
    """Descriptografa uma string."""
    if not encrypted_data:
        return encrypted_data
    try:
        decrypted = f.decrypt(encrypted_data.encode('utf-8'))
        return decrypted.decode('utf-8')
    except Exception as e:
        print(f"Erro ao descriptografar dado: {str(e)}")
        return None
