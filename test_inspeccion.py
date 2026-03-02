import requests

urls = [
    "http://172.16.71.199:8000/api/inspeccion/valoracion",
    "http://172.16.71.199:8000/inspeccion/valoracion",
    "http://172.16.71.199:8000/api/inspeccion/guardar"
]

for url in urls:
    try:
        print(f"Testing {url}...")
        # Try POST with empty dict as frontend does
        response = requests.post(url, json={}, timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
