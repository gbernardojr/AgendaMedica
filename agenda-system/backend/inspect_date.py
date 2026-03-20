import os
import pymssql
from dotenv import load_dotenv

load_dotenv()

def inspect_data():
    server = os.getenv('DB_SERVER')
    user = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')
    db_name = os.getenv('DB_NAME')
    port = os.getenv('DB_PORT')

    try:
        conn = pymssql.connect(
            server=server,
            user=user,
            password=password,
            database=db_name,
            port=int(port) if port else 1433
        )
        cursor = conn.cursor(as_dict=True)
        
        print("\n--- Agendamentos 2026-03-16 ---")
        cursor.execute("SELECT ag_codigo, ag_data, ag_hora, ag_nome, ag_codmedico FROM agenda WHERE CAST(ag_data AS DATE) = '2026-03-16' ORDER BY ag_hora")
        for row in cursor.fetchall():
            print(row)
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_data()
