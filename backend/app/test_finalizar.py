import requests
import json

def test_finalizar_proceso():
    url = "http://127.0.0.1:3000/api/orden/finalizar_proceso"
    
    payload = {
      "Orden": {
        "OrdenID": None,
        "UsuarioID": 1,
        "ClienteID": None,
        "VehiculoID": None,
        "AsesorID": 1,
        "OrdenIDGen": "0",
        "OrdenTipo": "1",
        "OrdenFecha": "2026-02-20T16:10:00",
        "OrdenFechaIngreso": "2026-02-20T16:10:00",
        "OrdenFechaEntrega": None,
        "OrdenObservaciones": "Cliente solicita revisión general y cambio de aceite (TEST AUTOMATIZADO)",
        "OrdenEstatus": "A",
        "SucursalID": 1
      },
      "Cliente": {
        "ClienteID": None,
        "ClienteClave": "CLI000345",
        "ClienteNombre": "Juan Perez Test",
        "ClienteRazon": None,
        "ClienteRegimen": "PERSONA FISICA",
        "ClienteRFC": "PEPJ800101AA1",
        "ClienteDomicilio": "Av. Reforma 123",
        "ClienteDomicilio2": "Col. Centro",
        "ClienteCiudad": "Monterrey",
        "ClienteEstadoClave": "NL",
        "ClienteEstadoNombre": "Nuevo León",
        "ClienteCP": "64000",
        "ClienteCategoria": "CONTADO",
        "ClienteDiasCredito": 0,
        "ClienteFechaAlta": "2026-02-20T16:10:00",
        "ClienteEstatus": "A",
        "ClienteIDGen": "0"
      },
      "Vehiculo": {
        "VehiculoID": None,
        "VehiculoPlacas": "TEST123A",
        "VehiculoMarca": "Nissan TEST",
        "VehiculoModelo": "Versa 2020",
        "VehiculoColor": "Blanco",
        "VehiculoNumSerie": "3N1CN7AP0LK123456TEST",
        "VehiculoIDGen": 1,
        "ClienteID": None
      },
      "Evidencia": [],
      "Inspeccion": []
    }

    try:
        print(f"Cargando peticion a {url}...")
        response = requests.post(url, json=payload, timeout=20)
        print(f"Status Code: {response.status_code}")
        
        try:
            print("Response JSON:")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        except ValueError:
            print("Response Text (No es JSON):")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"Falla en la peticion HTTP: {e}")

if __name__ == "__main__":
    test_finalizar_proceso()
