import urllib.request
import json

def test_login_and_fetch():
    base_url = "http://localhost:5000"
    
    # 1. Login
    login_data = json.dumps({
        "username": "gbernardojr",
        "password": "Gabj#1975"
    }).encode('utf-8')
    
    req = urllib.request.Request(f"{base_url}/login", data=login_data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
    except Exception as e:
        print(f"Login failed: {e}")
        return
        
    token = data['token']
    print(f"Logged in as: {data['user']['nome']} (Admin: {data['user']['admin']})")
    print(f"Permissions: {data['user']['perms']}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Fetch Professionals
    req = urllib.request.Request(f"{base_url}/profissionais", headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            pros = json.loads(response.read().decode())
            print(f"\nProfissionais status: 200")
            print(f"Profissionais count: {len(pros)}")
            for p in pros:
                print(f" - {p['nome']} (CRM: {p['crm']})")
    except Exception as e:
        print(f"Fetch prof failed: {e}")
        
    # 3. Fetch Agenda for today (2026-03-16)
    url = f"{base_url}/agendamentos?data=2026-03-16"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            ags = json.loads(response.read().decode())
            print(f"\nAgendamentos (no filter) count: {len(ags)}")
            for a in ags:
                print(f" - {a['ag_hora']} {a['ag_nome']} (CRM: {a['ag_codmedico']})")
    except Exception as e:
        print(f"Fetch ags failed: {e}")

if __name__ == "__main__":
    test_login_and_fetch()
