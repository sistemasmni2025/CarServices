import requests

urls = [
    "http://172.16.71.199:3000/api/inspeccion/valoracion",
    "http://172.16.71.199:3000/inspeccion/valoracion"
]

for url in urls:
    try:
        print(f"Testing {url}...")
        response = requests.post(url, json={}, timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
