import requests
import json
import codecs

urls = [
    "http://172.16.71.199:8000/orden/listar",
    "http://172.16.71.199:8000/ingresos/listar"
]

payload = {"SucursalID": "1"}

print("Starting tests...")
with codecs.open("listar_clean.txt", "w", encoding="utf-8") as f:
    for url in urls:
        f.write(f"\n--- Testing {url} ---\n")
        try:
            r = requests.post(url, json=payload, timeout=5)
            f.write(f"Status: {r.status_code}\n")
            if r.status_code == 200:
                data = r.json()
                f.write(f"Type: {type(data)}\n")
                if isinstance(data, list) and len(data) > 0:
                    f.write(json.dumps(data[len(data)-1], indent=2))
                elif isinstance(data, dict):
                    f.write("It's a dict: " + json.dumps(data, indent=2)[:500])
                else:
                    f.write(f"Unknown data structure: {type(data)}")
            else:
                f.write(f"Response: {r.text[:200]}\n")
        except Exception as e:
            f.write(f"Error: {e}\n")
print("Done!")
