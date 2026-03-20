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
        
        print("\n--- Usuarios ---")
        cursor.execute("SELECT usu_id, usu_username, usu_nome, usu_admin, perm_agenda FROM Usuarios")
        for row in cursor.fetchall():
            print(f"ID: {row['usu_id']}, User: {row['usu_username']}, Admin: {row['usu_admin']}, PermAgenda: {row['perm_agenda']}")
            
        print("\n--- Profissionais (medicos) ---")
        cursor.execute("SELECT med_crm, med_nome FROM medicos")
        for row in cursor.fetchall():
            print(f"CRM: {row['med_crm']}, Nome: {row['med_nome']}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_data()
