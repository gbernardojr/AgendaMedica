# Como Executar o Sistema AgendaMedica

## 1. Pré-requisitos
- Python 3.12
- SQL Server local com DB `klinis` (arquivos .mdf/.ldf em db/)
- Node.js 18+

## 2. Configurar Backend
```
cd agenda-system/backend
```
- Verifique `.env`:
```
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=klinis
DB_USER=sa
DB_PASSWORD=sua_senha
SECRET_KEY=supersecret
JWT_SECRET_KEY=jwtsecret
FRONTEND_URL=http://localhost:5173
```
- Instale deps: `pip install -r requirements.txt` (já feito)
- **Seeds DB** (importante!):
  Abra SQL Server Management Studio > Conecte > DB klinis > Execute `db/seeds.sql` (cria status + admin/medico).

## 3. Rodar Backend
```
cd agenda-system/backend
python app.py
```
- Backend: http://localhost:5000
- Test Postman:
  - POST /login: `{"username":"admin","password":"admin"}`
  - Use token em Authorization Bearer.

## 4. Frontend
```
cd agenda-system/frontend
npm install
npm run dev
```
- Frontend: http://localhost:5173

## 5. Testes
- Login admin.
- POST agendamentos (busca paciente fuzzy).
- Caixa, reports PDF.

## Problemas?
- DB connect: Ver .env/SQL Server running.
- Indent Pylance: Ignore, código OK.

Sistema pronto! 🚀
