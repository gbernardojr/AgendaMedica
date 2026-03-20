# Sistema de Agenda Médica (Klinis) - Guia de Execução

Este projeto foi totalmente revitalizado para atender aos requisitos de modernidade, segurança e funcionalidade.

## 🚀 Como Executar

### 1. Backend (Flask)
Navegue até a pasta `backend` e siga os passos:

```powershell
cd backend
# Instale as dependências
pip install -r requirements.txt
# Configure o .env (já configurado para localhost)
# Execute o servidor
python app.py
```
*O banco de dados será criado automaticamente no SQL Server conforme configurado no `.env`.*
*Usuário Padrão:* `admin` / `admin123`

### 2. Frontend (React)
Navegue até a pasta `frontend`:

```powershell
cd frontend
# Instale as dependências
npm install
# Execute o ambiente de desenvolvimento
npm run dev
```

## ✨ Funcionalidades Implementadas
- **Login Seguro**: Autenticação via JWT com verificação na tabela `Usuarios`.
- **Agenda Inteligente**: Permite agendar por nome. Se o paciente for cadastrado depois, o sistema vincula retroativamente.
- **Controle de Status**: Transição entre 'Agendado', 'Em tratamento' e 'Finalizado'.
- **Mudança de Data**: Função dedicada para mover agendamentos no tempo.
- **Controle de Caixa**: Registro de recebimentos vinculado a agendamentos, alimentando o financeiro.
- **Logs de Auditoria**: Cada ação (criar, editar, deletar, login) gera um registro na tabela `Logs`.
- **Relatórios**: Exportação profissional em PDF (com tabelas), Excel (.xlsx) e CSV.
- **Design Premium**: Interface disruptiva feita para impressionar o cliente final.

## 🛠 Tecnologias
- **Backend**: Flask, SQLAlchemy, pymssql, Pandas, ReportLab.
- **Frontend**: React (Vite), Material UI, Lucide Icons, Date-fns.
- **Banco de Dados**: Microsoft SQL Server 2022.
