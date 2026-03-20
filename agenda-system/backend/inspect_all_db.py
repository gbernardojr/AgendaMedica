import os
import pymssql
from dotenv import load_dotenv

load_dotenv()

def inspect_all():
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
        cursor = conn.cursor()
        cursor.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
        tables = cursor.fetchall()
        print("Tables in database:")
        for table in tables:
            tname = table[0]
            print(f"\n--- {tname} ---")
            cursor.execute(f"SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{tname}'")
            cols = cursor.fetchall()
            for col in cols:
                print(f" - {col[0]} ({col[1]})")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_all()
