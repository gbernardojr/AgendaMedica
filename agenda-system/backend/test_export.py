import urllib.request
import json
import os

def test_export():
    base_url = "http://localhost:5000"
    
    # 1. Login
    login_data = json.dumps({
        "username": "admin",
        "password": "admin123"
    }).encode('utf-8')
    
    req = urllib.request.Request(f"{base_url}/login", data=login_data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
    except Exception as e:
        print(f"Login failed: {e}")
        return
        
    token = data['token']
    
    # 2. Test PDF Export via Query String Token
    # Using query string because that's how Dashboard.jsx does it
    url = f"{base_url}/reports/export?format=pdf&token={token}&data=2026-03-16"
    print(f"\nRequesting: {url}")
    
    try:
        with urllib.request.urlopen(url) as response:
            content_type = response.headers.get('Content-Type')
            content_disp = response.headers.get('Content-Disposition')
            print(f"Status: {response.status}")
            print(f"Content-Type: {content_type}")
            print(f"Content-Disposition: {content_disp}")
            
            content = response.read()
            print(f"Content length: {len(content)} bytes")
            
            if content.startswith(b'%PDF'):
                print("SUCCESS: Starts with %PDF header")
                # Save it to check
                with open("test_report.pdf", "wb") as f:
                    f.write(content)
                print("Saved to test_report.pdf")
            else:
                print("FAILURE: Does not start with %PDF header")
                print("First 100 bytes:", content[:100])
                
    except Exception as e:
        print(f"Export failed: {e}")

if __name__ == "__main__":
    test_export()
