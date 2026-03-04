import requests
import json
import codecs

url = "http://172.16.71.199:8000/asesores/"

print("Testing Asesores endpoint...")
with codecs.open("/tmp/probe_asesores.txt", "w", encoding="utf-8") as f:
    try:
        r = requests.get(url, timeout=10)
        f.write(f"Status: {r.status_code}\n")
        if r.status_code == 200:
            data = r.json()
            f.write(f"Type: {type(data)}\n")
            if isinstance(data, list):
                f.write(f"Length: {len(data)}\n")
                if len(data) > 0:
                    f.write(json.dumps(data[0], indent=2) + "\n...\n")
            elif isinstance(data, dict):
                f.write(json.dumps(data, indent=2)[:500])
        else:
            f.write(f"Response: {r.text[:200]}\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
print("Done!")
