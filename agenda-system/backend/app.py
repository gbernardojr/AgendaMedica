from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_, func
from datetime import datetime, date
import pandas as pd
import io
from functools import wraps
import pymssql
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

load_dotenv()

# --- PRE-START SCHEMA UPDATE ---
def update_schema():
    try:
        conn = pymssql.connect(
            server=os.getenv('DB_SERVER'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME'),
            port=int(os.getenv('DB_PORT'))
        )
        cursor = conn.cursor()
        cols_u = ['perm_agenda', 'perm_clientes', 'perm_profissionais', 'perm_procedimentos']
        for col in cols_u:
            cursor.execute(f"IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Usuarios') AND name = '{col}') ALTER TABLE Usuarios ADD {col} BIT DEFAULT 1")
        
        # Caixa professional split
        cursor.execute(f"IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('caixa') AND name = 'med_crm') ALTER TABLE caixa ADD med_crm VARCHAR(20) NULL")
        conn.commit()
        conn.close()
        print("Schema updated successfully.")
    except Exception as e:
        print(f"Schema update error: {e}")

update_schema()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-dev-secret')
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'query_string']
app.config['JWT_QUERY_STRING_NAME'] = 'token'

CORS(app, resources={r"/*": {"origins": "*"}}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
jwt = JWTManager(app)

DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASSWORD')
DB_SERVER = os.getenv('DB_SERVER')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')

app.config['SQLALCHEMY_DATABASE_URI'] = f"mssql+pymssql://{DB_USER}:{DB_PASS}@{DB_SERVER}:{DB_PORT}/{DB_NAME}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- MODELS ---

class Usuarios(db.Model):
    __tablename__ = 'Usuarios'
    usu_id = db.Column(db.Integer, primary_key=True, autoincrement=False)
    usu_username = db.Column(db.String(15), unique=True, nullable=True)
    usu_senha = db.Column(db.String(255), nullable=True)
    usu_nome = db.Column(db.String(80), nullable=True)
    usu_admin = db.Column(db.String(1), default='N')
    perm_agenda = db.Column(db.Boolean, default=True)
    perm_clientes = db.Column(db.Boolean, default=True)
    perm_profissionais = db.Column(db.Boolean, default=False)
    perm_procedimentos = db.Column(db.Boolean, default=False)

class Procedimentos(db.Model):
    __tablename__ = 'procedimentos'
    proc_id = db.Column(db.Integer, primary_key=True)
    proc_nome = db.Column(db.String(100), nullable=False)
    proc_valor = db.Column(db.Numeric(18, 2), nullable=True)

class Profissionais(db.Model):
    __tablename__ = 'medicos'
    med_crm = db.Column(db.String(20), primary_key=True)
    med_nome = db.Column(db.String(100), nullable=False)

class Logs(db.Model):
    __tablename__ = 'Logs'
    id = db.Column(db.Integer, primary_key=True)
    data_hora = db.Column(db.DateTime, default=datetime.now)
    usuario_id = db.Column(db.Integer, nullable=True)
    acao = db.Column(db.String(100), nullable=False)
    tabela = db.Column(db.String(50), nullable=True)
    registro_id = db.Column(db.Integer, nullable=True)
    ip = db.Column(db.String(45), nullable=True)

class Pacientes(db.Model):
    __tablename__ = 'pacientes'
    pac_id = db.Column(db.Integer, primary_key=True)
    pac_nome = db.Column(db.String(100), nullable=False)
    pac_nascimento = db.Column(db.Date, nullable=True)
    pac_telefone = db.Column(db.String(20), nullable=True)
    pac_email = db.Column(db.String(100), nullable=True)
    pac_sexo = db.Column(db.String(1), nullable=True)

class Agenda(db.Model):
    __tablename__ = 'agenda'
    ag_codigo = db.Column(db.Integer, primary_key=True, autoincrement=False)
    ag_data = db.Column(db.DateTime, nullable=True)
    ag_hora = db.Column(db.String(5), nullable=True)
    ag_nome = db.Column(db.String(100), nullable=True)
    ag_codpaciente = db.Column(db.Integer, db.ForeignKey('pacientes.pac_id'), nullable=True)
    ag_status = db.Column(db.Integer, default=1)
    ag_convenio = db.Column(db.String(100), nullable=True)
    ag_pago = db.Column(db.Boolean, default=False)
    ag_obs = db.Column(db.String(500), nullable=True)
    ag_codmedico = db.Column(db.String(20), db.ForeignKey('medicos.med_crm'), nullable=True)
    profissional = db.relationship('Profissionais', backref='agendamentos', lazy=True)

class Caixa(db.Model):
    __tablename__ = 'caixa'
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.DateTime, default=datetime.now)
    valor = db.Column(db.Numeric(18, 2), nullable=False)
    forma_pagto = db.Column(db.String(50), nullable=False)
    ag_codigo = db.Column(db.Integer, db.ForeignKey('agenda.ag_codigo'), nullable=True)
    pagante = db.Column(db.String(100), nullable=True)
    med_crm = db.Column(db.String(20), db.ForeignKey('medicos.med_crm'), nullable=True)

# --- HELPERS ---
def log_action(acao, t=None, rid=None):
    try:
        uid = None
        try: uid = int(get_jwt_identity())
        except: pass
        db.session.add(Logs(usuario_id=uid, acao=acao, tabela=t, registro_id=rid, ip=request.remote_addr))
        db.session.commit()
    except: pass

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def d(*args, **kwargs):
            u = Usuarios.query.get(int(get_jwt_identity()))
            if u and u.usu_admin == 'S': return fn(*args, **kwargs)
            return jsonify({'msg': 'Admin only'}), 403
        return d
    return wrapper

def permission_required(p):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def d(*args, **kwargs):
            u = Usuarios.query.get(int(get_jwt_identity()))
            if u and (u.usu_admin == 'S' or getattr(u, f'perm_{p}', False)): return fn(*args, **kwargs)
            return jsonify({'msg': 'No permission'}), 403
        return d
    return wrapper

# --- ROUTES ---
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    u = Usuarios.query.filter_by(usu_username=data.get('username')).first()
    if u and check_password_hash(u.usu_senha, data.get('password')):
        t = create_access_token(identity=str(u.usu_id))
        return jsonify({'token': t, 'user': {
            'id': u.usu_id, 'nome': u.usu_nome, 'admin': u.usu_admin == 'S',
            'perms': {'agenda': u.perm_agenda or u.usu_admin=='S', 'clientes': u.perm_clientes or u.usu_admin=='S', 'profissionais': u.perm_profissionais or u.usu_admin=='S', 'procedimentos': u.perm_procedimentos or u.usu_admin=='S'}
        }})
    return jsonify({'msg': 'Invalid'}), 401

# Profissionais: GET is open for any authenticated user
@app.route('/profissionais', methods=['GET'])
@jwt_required()
def get_pros():
    return jsonify([{'crm': p.med_crm, 'nome': p.med_nome} for p in Profissionais.query.all()])

@app.route('/profissionais', methods=['POST'])
@permission_required('profissionais')
def pro_create():
    d = request.json
    if Profissionais.query.get(d['crm']): return jsonify({'msg': 'Profissional já existe'}), 400
    p = Profissionais(med_crm=d['crm'], med_nome=d['nome'])
    db.session.add(p); db.session.commit(); return jsonify({'msg': 'ok'}), 201

@app.route('/profissionais/<crm>', methods=['PUT', 'DELETE'])
@permission_required('profissionais')
def pro_crud(crm):
    p = Profissionais.query.get_or_404(crm)
    if request.method == 'DELETE': 
        db.session.delete(p); db.session.commit(); return jsonify({'msg': 'ok'})
    p.med_nome = request.json['nome']; db.session.commit(); return jsonify({'msg': 'ok'})

@app.route('/pacientes', methods=['GET', 'POST'])
@permission_required('clientes')
def pac_list():
    if request.method == 'GET':
        q = request.args.get('q', '')
        pacs = Pacientes.query.filter(or_(Pacientes.pac_nome.ilike(f'%{q}%'), Pacientes.pac_telefone.ilike(f'%{q}%'))).all()
        return jsonify([{'id': p.pac_id, 'nome': p.pac_nome, 'tel': p.pac_telefone, 'email': p.pac_email} for p in pacs])
    d = request.json; mid = db.session.query(func.max(Pacientes.pac_id)).scalar() or 0
    p = Pacientes(pac_id=mid+1, pac_nome=d['pac_nome'], pac_telefone=d.get('pac_telefone'), pac_email=d.get('pac_email'))
    db.session.add(p); db.session.commit(); return jsonify({'id': p.pac_id}), 201

@app.route('/procedimentos', methods=['GET', 'POST'])
@permission_required('procedimentos')
def proc_list():
    if request.method == 'GET': return jsonify([{'id': p.proc_id, 'nome': p.proc_nome, 'valor': float(p.proc_valor or 0)} for p in Procedimentos.query.all()])
    d = request.json; p = Procedimentos(proc_nome=d['nome'], proc_valor=d.get('valor', 0)); db.session.add(p); db.session.commit(); return jsonify({'id': p.proc_id}), 201

@app.route('/usuarios', methods=['GET', 'POST'])
@admin_required()
def user_list():
    if request.method == 'GET': return jsonify([{'id': u.usu_id, 'username': u.usu_username, 'nome': u.usu_nome, 'admin': u.usu_admin=='S', 'perm_agenda': u.perm_agenda, 'perm_clientes': u.perm_clientes, 'perm_profissionais': u.perm_profissionais, 'perm_procedimentos': u.perm_procedimentos} for u in Usuarios.query.all()])
    d = request.json; mid = db.session.query(func.max(Usuarios.usu_id)).scalar() or 0
    u = Usuarios(usu_id=mid+1, usu_username=d['username'], usu_senha=generate_password_hash(d['password']), usu_nome=d['nome'], usu_admin='S' if d.get('admin') else 'N', perm_agenda=d.get('perm_agenda', True), perm_clientes=d.get('perm_clientes', True), perm_profissionais=d.get('perm_profissionais', False), perm_procedimentos=d.get('perm_procedimentos', False))
    db.session.add(u); db.session.commit(); return jsonify({'id': u.usu_id}), 201

@app.route('/usuarios/<int:id>', methods=['PUT', 'DELETE'])
@admin_required()
def user_crud_id(id):
    u = Usuarios.query.get_or_404(id)
    if request.method == 'DELETE':
        if u.usu_username == 'admin': return jsonify({'msg': 'Não é possível excluir o administrador'}), 400
        db.session.delete(u); db.session.commit(); return jsonify({'msg': 'ok'})
    d = request.json
    u.usu_nome = d.get('nome', u.usu_nome)
    if d.get('password'): u.usu_senha = generate_password_hash(d['password'])
    u.usu_admin = 'S' if d.get('admin') else 'N'
    u.perm_agenda = d.get('perm_agenda', u.perm_agenda)
    u.perm_clientes = d.get('perm_clientes', u.perm_clientes)
    u.perm_profissionais = d.get('perm_profissionais', u.perm_profissionais)
    u.perm_procedimentos = d.get('perm_procedimentos', u.perm_procedimentos)
    db.session.commit(); return jsonify({'msg': 'ok'})

# Agendamentos: GET open for any authenticated user (visibility)
@app.route('/agendamentos', methods=['GET'])
@jwt_required()
def get_agendamentos():
    dt_str = request.args.get('data'); crm = request.args.get('profissional_crm'); query = Agenda.query
    if crm: query = query.filter_by(ag_codmedico=crm)
    if dt_str: 
        dt = datetime.strptime(dt_str, '%Y-%m-%d')
        query = query.filter(Agenda.ag_data >= dt, Agenda.ag_data <= datetime(dt.year, dt.month, dt.day, 23, 59, 59))
    res = []
    for a in query.all():
        c_entry = Caixa.query.filter_by(ag_codigo=a.ag_codigo).first()
        res.append({
            'ag_codigo': a.ag_codigo, 
            'ag_data': a.ag_data.isoformat() if a.ag_data else None, 
            'ag_hora': a.ag_hora, 
            'ag_nome': a.ag_nome, 
            'ag_status': a.ag_status, 
            'ag_pago': a.ag_pago, 
            'ag_obs': a.ag_obs, 
            'ag_codmedico': a.ag_codmedico,
            'ag_valor': float(c_entry.valor) if c_entry else 0,
            'ag_convenio': a.ag_convenio
        })
    return jsonify(res)

@app.route('/agendamentos', methods=['POST'])
@permission_required('agenda')
def create_agendamento():
    d = request.json; mid = db.session.query(func.max(Agenda.ag_codigo)).scalar() or 0
    a = Agenda(ag_codigo=mid+1, ag_data=datetime.strptime(d['ag_data'], '%Y-%m-%d'), ag_hora=d['ag_hora'], ag_nome=d['ag_nome'], ag_codmedico=d.get('ag_codmedico'), ag_status=1, ag_pago=False, ag_obs=d.get('ag_observacao', ''))
    db.session.add(a); db.session.commit(); return jsonify({'id': a.ag_codigo}), 201

@app.route('/agendamentos/<int:id>', methods=['PUT', 'DELETE'])
@permission_required('agenda')
def agenda_crud_id(id):
    a = Agenda.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(a); db.session.commit(); return jsonify({'msg': 'ok'})
    d = request.json
    for k, v in d.items():
        if hasattr(a, k): setattr(a, k, v)
    if 'ag_data' in d: a.ag_data = datetime.strptime(d['ag_data'], '%Y-%m-%d')
    db.session.commit(); return jsonify({'msg': 'ok'})

@app.route('/caixa/receber', methods=['POST'])
@jwt_required()
def receber():
    d = request.json; ag = Agenda.query.get_or_404(d['ag_codigo'])
    c = Caixa(valor=d['valor'], forma_pagto=d['forma_pagto'], ag_codigo=ag.ag_codigo, pagante=d.get('pagante', ag.ag_nome), med_crm=ag.ag_codmedico)
    db.session.add(c); ag.ag_pago = True; db.session.commit(); return jsonify({'id': c.id}), 201

@app.route('/reports/export', methods=['GET'])
@jwt_required()
def export_report():
    fmt = request.args.get('format', 'pdf')
    dt_str = request.args.get('data')
    crm = request.args.get('profissional_crm')
    
    query = Agenda.query
    if crm: query = query.filter_by(ag_codmedico=crm)
    if dt_str:
        dt = datetime.strptime(dt_str, '%Y-%m-%d')
        query = query.filter(Agenda.ag_data >= dt, Agenda.ag_data <= datetime(dt.year, dt.month, dt.day, 23, 59, 59))
    
    items = query.all()
    df_data = []
    total_valor = 0
    for a in items:
        p = Profissionais.query.get(a.ag_codmedico) if a.ag_codmedico else None
        c_entry = Caixa.query.filter_by(ag_codigo=a.ag_codigo).first()
        valor = float(c_entry.valor) if c_entry else 0
        total_valor += valor
        df_data.append({
            'Data': a.ag_data.strftime('%d/%m/%Y') if a.ag_data else '',
            'Hora': a.ag_hora,
            'Paciente': a.ag_nome,
            'Profissional': p.med_nome if p else 'N/A',
            'Status': 'Agendado' if a.ag_status == 1 else ('Em Atendimento' if a.ag_status == 2 else 'Finalizado'),
            'Pago': 'Sim' if a.ag_pago else 'Não',
            'Valor': valor,
            'Obs': a.ag_obs
        })
    df = pd.DataFrame(df_data)

    if fmt == 'csv':
        o = io.BytesIO()
        df.to_csv(o, index=False, encoding='utf-8-sig')
        o.seek(0)
        filename = f"relatorio_{dt_str or 'geral'}.csv"
        return send_file(o, mimetype='text/csv', as_attachment=True, download_name=filename)
    
    if fmt == 'xlsx':
        o = io.BytesIO()
        with pd.ExcelWriter(o, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        o.seek(0)
        filename = f"relatorio_{dt_str or 'geral'}.xlsx"
        return send_file(o, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', as_attachment=True, download_name=filename)

    if fmt == 'pdf':
        o = io.BytesIO()
        doc = SimpleDocTemplate(o, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        title = f"Relatório de Agendamentos - {dt_str if dt_str else 'Geral'}"
        elements.append(Paragraph(title, styles['Title']))
        
        if crm:
            p = Profissionais.query.get(crm)
            elements.append(Paragraph(f"Profissional: {p.med_nome if p else crm}", styles['Normal']))
        elements.append(Spacer(1, 12))
        
        if not df_data:
            elements.append(Paragraph("Nenhum dado encontrado para os filtros selecionados.", styles['Normal']))
        else:
            table_data = [['Hora', 'Paciente', 'Status', 'Pago', 'Valor']]
            for d in df_data:
                table_data.append([
                    str(d['Hora'] or ''), 
                    str(d['Paciente'] or '')[:20], 
                    str(d['Status'] or ''), 
                    str(d['Pago'] or ''),
                    f"R$ {d['Valor'] if d['Valor'] else 0:.2f}"
                ])
            
            table_data.append(['', 'TOTAL', '', '', f"R$ {total_valor:.2f}"])
            
            t = Table(table_data)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ]))
            elements.append(t)
            
        doc.build(elements)
        o.seek(0)
        filename = f"relatorio_{dt_str or 'geral'}.pdf"
        return send_file(o, mimetype='application/pdf', as_attachment=True, download_name=filename)

    return jsonify({'msg': 'Formato inválido'}), 400

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        if not Usuarios.query.filter_by(usu_username='admin').first():
            db.session.add(Usuarios(usu_id=1, usu_username='admin', usu_senha=generate_password_hash('admin123'), usu_nome='Admin', usu_admin='S'))
            db.session.commit()
    app.run(debug=True, port=5000)
