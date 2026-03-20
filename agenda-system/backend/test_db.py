import os
import pymssql
from dotenv import load_dotenv

# Carrega configurações do .env
load_dotenv()

def test_connection():
    server = os.getenv('DB_SERVER')
    user = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')
    db_name = os.getenv('DB_NAME')
    port = os.getenv('DB_PORT')

    print(f"--- Diagnóstico de Conexão ---")
    print(f"Servidor: {server}")
    print(f"Porta: {port}")
    print(f"Usuário: {user}")
    print(f"Banco: {db_name}")
    print(f"------------------------------")

    try:
        # Tenta conectar via pymssql
        conn = pymssql.connect(
            server=server,
            user=user,
            password=password,
            database=db_name,
            port=int(port) if port else 1433,
            timeout=5
        )
        print("✅ CONEXÃO ESTABELECIDA COM SUCESSO!")
        
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        row = cursor.fetchone()
        print(f"Versão do SQL Server: {row[0]}")
        
        conn.close()
    except pymssql.Error as e:
        print("❌ ERRO AO CONECTAR!")
        print(f"Código do Erro: {e.args[0]}")
        print(f"Mensagem: {e.args[1].decode('latin-1') if isinstance(e.args[1], bytes) else e.args[1]}")
    except Exception as e:
        print(f"❌ ERRO INESPERADO: {str(e)}")

if __name__ == "__main__":
    test_connection()
