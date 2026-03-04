import requests
import json
import codecs

url = "http://172.16.71.199:8000/orden/listar"
payload = {}

print("Testing ALL orders...")
with codecs.open("listar_all.txt", "w", encoding="utf-8") as f:
    try:
        r = requests.post(url, json=payload, timeout=10)
        f.write(f"Status: {r.status_code}\n")
        if r.status_code == 200:
            data = r.json()
            f.write(f"Type: {type(data)}\n")
            if isinstance(data, list):
                f.write(f"Length: {len(data)}\n")
                if len(data) > 0:
                    f.write(json.dumps(data[-1], indent=2))
            elif isinstance(data, dict):
                f.write("Dict keys: " + str(data.keys()) + "\n")
                f.write(json.dumps(data, indent=2)[:500])
        else:
            f.write(f"Response: {r.text[:200]}\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
