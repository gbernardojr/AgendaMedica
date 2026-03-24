from werkzeug.security import generate_password_hash
import pymssql

conn = pymssql.connect(
    server='127.0.0.1',
    user='klinis',
    password='Gabj#1975',
    database='klinis',
    port=53505
)
cursor = conn.cursor()

senha_hash = generate_password_hash('admin123')
cursor.execute("UPDATE Usuarios SET usu_senha = %s WHERE usu_username = 'admin'", senha_hash)
conn.commit()

print(f"[*] Senha do admin resetada para: admin123")
print(f"[*] Hash: {senha_hash}")

conn.close()
