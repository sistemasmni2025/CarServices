import requests
import json
import codecs

url = "http://172.16.71.199:8000/orden/listar"

# Testing different casings to see what the backend accepts and returns data for
payloads_to_test = [
    {"name": "Empty Payload", "data": {}},
    {"name": "Standard Genexus Casing", "data": {"SucursalID": 1, "OrdenEstatus": "A"}},
    {"name": "Mixed Case 1 (User)", "data": {"SucursalId": 1, "Ordenestatus": "A"}},
    {"name": "Mixed Case 2", "data": {"sucursalId": 1, "ordenEstatus": "A"}},
    {"name": "Lowercase", "data": {"sucursalid": 1, "ordenestatus": "A"}},
    {"name": "Standard with OrdenID null", "data": {"SucursalID": 1, "OrdenEstatus": "A", "OrdenID": None}},
    {"name": "User Payload exactly", "data": {"SucursalId": 1, "Ordenestatus": "A", "OrdenId": 0}},
    {"name": "All 3 standard", "data": {"SucursalID": 1, "OrdenEstatus": "A", "OrdenID": 0}}
]

print("Testing different payload casings for /orden/listar...")
with codecs.open("/tmp/probe_listar_casing.txt", "w", encoding="utf-8") as f:
    for test in payloads_to_test:
        f.write(f"\n--- Testing {test['name']} ---\n")
        f.write(f"Payload: {json.dumps(test['data'])}\n")
        try:
            r = requests.post(url, json=test['data'], timeout=10)
            f.write(f"Status: {r.status_code}\n")
            if r.status_code == 200:
                data = r.json()
                if isinstance(data, list):
                    f.write(f"Returned List Length: {len(data)}\n")
                    # If empty, write empty
                    if len(data) == 0:
                         f.write("Result: []\n")
                    else:
                        # Write just the first item keys to see return casing
                        f.write(f"Keys of first item: {list(data[0].keys())}\n")
                elif isinstance(data, dict):
                    f.write(f"Returned Dict Keys: {list(data.keys())}\n")
            else:
                f.write(f"Error Response: {r.text[:200]}\n")
        except Exception as e:
            f.write(f"Exception: {e}\n")

print("Done probing casings!")
