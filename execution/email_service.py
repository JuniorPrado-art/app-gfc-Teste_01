import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# Ler credenciais a partir de variáveis de ambiente seguras (.env)
GMAIL_USER = os.getenv("GMAIL_USER")
# Recomenda-se gerar uma "Senha de App" (App Password) no Google para não usar a senha raiz.
GMAIL_PASS = os.getenv("GMAIL_PASS")

def send_alert_email(subject: str, body: str, to_emails: list) -> bool:
    """
    Função genérica para disparar e-mails utilizando o Gmail do Aplicativo GFC.
    Usada para alertas e para envio manual de chamados em caso de fallback (erro).
    """
    if not GMAIL_USER or not GMAIL_PASS:
        print("Erro: Credenciais do Gmail não configuradas no '.env'.")
        return False

    msg = MIMEMultipart()
    msg['From'] = GMAIL_USER
    msg['To'] = ", ".join(to_emails)
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html'))

    try:
        # Configuração padrão do SMTP do Gmail (TLS na porta 587)
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASS)
        text = msg.as_string()
        # Envio efetivo
        server.sendmail(GMAIL_USER, to_emails, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Erro ao enviar o email: {e}")
        return False
