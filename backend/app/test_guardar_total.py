import requests
import json

def test():
    url = "http://172.16.71.199:8000/orden/guardar_total"
    
    payload = {
      "Orden": {
        "OrdenID": None,
        "UsuarioID": 1,
        "ClienteID": "28546",
        "VehiculoID": None,
        "AsesorID": 1,
        "OrdenIDGen": "0",
        "OrdenTipo": "1",
        "OrdenFecha": "2026-02-20T16:10:00",
        "OrdenFechaIngreso": "2026-02-20T16:10:00",
        "OrdenFechaEntrega": None,
        "OrdenObservaciones": "Prueba a orden/guardar_total",
        "OrdenEstatus": "A",
        "SucursalID": 1
      },
      "Cliente": {
        "ClienteID": "28546",
        "ClienteClave": "28546",
        "ClienteNombre": "Juan Perez Test",
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
        "ClienteID": "28546"
      },
      "Evidencia": [],
      "Inspeccion": []
    }

    try:
        r = requests.post(url, json=payload, timeout=20)
        print("Status", r.status_code)
        print("Response", r.text)
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    test()
