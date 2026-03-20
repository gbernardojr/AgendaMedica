import os
import pymssql
from dotenv import load_dotenv

load_dotenv()

def fix_schema():
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
            port=int(port) if port else 1433,
            autocommit=True
        )
        cursor = conn.cursor()
        
        print("Adding columns to 'caixa' table...")
        try:
            cursor.execute("ALTER TABLE caixa ADD forma_pagto VARCHAR(50)")
            print(" - Column 'forma_pagto' added.")
        except Exception as e:
            print(f" - Warning: 'forma_pagto' might already exist or error: {e}")

        try:
            cursor.execute("ALTER TABLE caixa ADD ag_codigo INT")
            print(" - Column 'ag_codigo' added.")
        except Exception as e:
            print(f" - Warning: 'ag_codigo' might already exist or error: {e}")

        # Also ensure agenda.ag_codigo is primary key for the foreign key to work
        print("Ensuring foreign key relationship...")
        try:
            cursor.execute("ALTER TABLE caixa ADD CONSTRAINT FK_caixa_agenda FOREIGN KEY (ag_codigo) REFERENCES agenda (ag_codigo)")
            print(" - Foreign key constraint added.")
        except Exception as e:
            print(f" - Warning: Foreign key might already exist or error: {e}")

        conn.close()
        print("✅ Schema update attempted.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_schema()
