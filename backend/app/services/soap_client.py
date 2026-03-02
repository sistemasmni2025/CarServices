from zeep import Client, Settings
from zeep.transports import Transport
from requests import Session
from .. import schemas

# URL del WSDL (Servicio SOAP Genexus)
# Se usa la IP 172.16.71.204 según lo indicado por el usuario.
WSDL_URL = "http://172.16.71.204:8080/mllntqa/servlet/aclientesos?WSDL"

def get_soap_client():
    """
    Crea y retorna un cliente SOAP usando Zeep.
    Configura timeouts, reintentos y desactiva verificación SSL si es necesario.
    """
    try:
        session = Session()
        session.verify = False 
        transport = Transport(session=session)
        session.adapters['http://'].max_retries = 3
        settings = Settings(strict=False, xml_huge_tree=True)
        # Inicializa el cliente con la URL del WSDL
        client = Client(WSDL_URL, transport=transport, settings=settings)
        return client
    except Exception as e:
        print(f"Error al crear cliente SOAP: {e}")
        raise e

def map_state_to_id(state_name: str) -> int:
    mapping = {
        "AGUASCALIENTES": 1, "BAJA CALIFORNIA": 2, "BAJA CALIFORNIA SUR": 3,
        "CAMPECHE": 4, "COAHUILA": 5, "COLIMA": 6, "CHIAPAS": 7, "CHIHUAHUA": 8,
        "CIUDAD DE MEXICO": 9, "CDMX": 9, "DURANGO": 10, "GUANAJUATO": 11,
        "GUERRERO": 12, "HIDALGO": 13, "JALISCO": 14, "MEXICO": 15, "ESTADO DE MEXICO": 15,
        "MICHOACAN": 16, "MORELOS": 17, "NAYARIT": 18, "NUEVO LEON": 19,
        "OAXACA": 20, "PUEBLA": 21, "QUERETARO": 22, "QUINTANA ROO": 23,
        "SAN LUIS POTOSI": 24, "SINALOA": 25, "SONORA": 26, "TABASCO": 27,
        "TAMAULIPAS": 28, "TLAXCALA": 29, "VERACRUZ": 30, "YUCATAN": 31, "ZACATECAS": 32
    }
    return mapping.get(str(state_name).upper(), 0)

def map_payment_conditions(condition: str) -> int:
    if "15" in condition: return 15
    if "30" in condition: return 30
    if "60" in condition: return 60
    return 0

def get_empty_structures():
    """Helper to return empty sdt structures for new signature"""
    sdt_clientes = {
        "clicve": 0, "clinom": "", "clirazons": "", "regimenclave": "",
        "regimennombre": "", "clirfc": "", "Domicilio": "", "Domicilio2": "",
        "Ciudad": "", "Estadoclave": 0, "EstadoNombre": "", "CodigoPostal": "",
        "Categoria": "", "DiasCredito": 0, "Climail": ""
    }
    sdt_placas = {
        "autplac": "", "autmarca": "", "autmod": "", "autanio": 0,
        "autcolor": "", "autmotor": "", "autserie": ""
    }
    return sdt_clientes, sdt_placas

def send_client_to_soap(client: schemas.ClientCreate, client_id_db: int):
    """
    Envía un nuevo cliente al servicio SOAP (Genexus).
    Mapea los datos del esquema Pydantic a la estructura SDT requerida por el SOAP.
    Usa Tp='N' (Nuevo).
    Retorna el ID generado por el sistema externo (Clicve).
    """
    try:
        client_soap = get_soap_client()
        service = client_soap.service

        # Separar clave y nombre del régimen fiscal
        regimen_parts = client.regimen_fiscal.split(" - ")
        regimen_clave = regimen_parts[0] if len(regimen_parts) > 0 else ""
        regimen_nombre = regimen_parts[1] if len(regimen_parts) > 1 else client.regimen_fiscal
        
        sdt_nuevo, sdt_placas_dummy = get_empty_structures()
        
        # Llenar estructura de Cliente (SDT)
        sdt_nuevo.update({
            "clicve": 0, 
            "clinom": client.nombre,
            "clirazons": client.razon_social or client.nombre,
            "regimenclave": regimen_clave,
            "regimennombre": regimen_nombre,
            "clirfc": client.rfc,
            "Domicilio": client.domicilio,
            "Domicilio2": client.domicilio2 or "",
            "Ciudad": client.ciudad,
            "Estadoclave": map_state_to_id(client.estado),
            "EstadoNombre": client.estado,
            "CodigoPostal": client.cp,
            "Categoria": client.categoria or "",
            "DiasCredito": map_payment_conditions(client.condiciones_pago)
        })
        
        # Ejecutar método SOAP
        # Parametros: Criterio, Sdtclientesnuevo, Clicvein, Placas, Sdtplacasosnuevo, Tp
        response = service.Execute(
            Criterio="", 
            Sdtclientesnuevo=sdt_nuevo, 
            Clicvein=0,
            Placas="",
            Sdtplacasosnuevo=sdt_placas_dummy,
            Tp="N" # 'N' indica Nuevo Cliente
        )
        
        print(f"Respuesta SOAP (Nuevo Cliente): {response}")
        
        # Extraer el ID generado (Clicve) de la respuesta
        new_soap_id = 0
        try:
            if hasattr(response, 'Clicve'):
                new_soap_id = response.Clicve
            elif isinstance(response, dict) and 'Clicve' in response:
                new_soap_id = response['Clicve']
        except:
             pass
             
        print(f"ID Generado SOAP: {new_soap_id}")
        return new_soap_id
        
    except Exception as e:
        print(f"Error conectando a servicio SOAP: {e}")
        raise e

def search_clients_soap(query: str):
    """
    Busca clientes en el servicio SOAP externo.
    Usa Tp='C' (Consulta).
    Parsea la respuesta compleja de Zeep para retornar una lista de diccionarios limpia.
    """
    try:
        client_soap = get_soap_client()
        service = client_soap.service
        
        sdt_dummy, sdt_placas_dummy = get_empty_structures()

        print(f"Buscando en SOAP Criterio='{query}'...")
        # Tp="C" para Consulta
        response = service.Execute(
            Criterio=query,
            Sdtclientesnuevo=sdt_dummy,
            Clicvein=0,
            Placas="",
            Sdtplacasosnuevo=sdt_placas_dummy,
            Tp="C" 
        )
        # Execute SOAP call
        # print(f"DEBUG RAW RESPONSE: {response}")
        # print(f"DEBUG DIR RESPONSE: {dir(response)}")
        
        # Parse result (handling array or single object)
        results = []
        items = []
        if hasattr(response, 'Sdtclientesos') and response.Sdtclientesos:
             if hasattr(response.Sdtclientesos, 'Sdtclientesos_Item'):
                 items = response.Sdtclientesos.Sdtclientesos_Item
             elif hasattr(response.Sdtclientesos, 'Item'):
                 items = response.Sdtclientesos.Item
             else:
                 try:
                     items = response.Sdtclientesos['SDTClientesOS.Item']
                 except: # fallback
                     items = [] # or verify if dict access works
        
        if items:
            for item in items:
                # Use getattr safely for zeep objects
                c_id = getattr(item, 'clicve', 0)
                c_nom = getattr(item, 'clinom', "")
                results.append({
                    "id": str(c_id),
                    "nombre": c_nom,
                    "rfc": getattr(item, 'clirfc', ""),
                    "codigo": str(c_id),
                    "razon_social": getattr(item, 'clirazons', "") or c_nom,
                    "regimen_fiscal": f"{getattr(item, 'regimenclave', '')} - {getattr(item, 'regimennombre', '')}",
                    "domicilio": getattr(item, 'Domicilio', ""),
                    "ciudad": getattr(item, 'Ciudad', ""),
                    "estado": getattr(item, 'EstadoNombre', ""),
                    "cp": getattr(item, 'CodigoPostal', ""),
                    "condiciones_pago": str(getattr(item, 'DiasCredito', 0))
                })
                
        return results 

    except Exception as e:
        error_msg = f"Error searching SOAP Clients: {e}\n"
        try:
             error_msg += f"DEBUG RAW RESPONSE ATTRIBUTES: {dir(response)}\n"
             if hasattr(response, '__dict__'):
                 error_msg += f"DEBUG RAW __dict__: {response.__dict__}\n"
        except:
             pass
        import traceback
        error_msg += traceback.format_exc()
        
        # Absolute path to ensure we can find it
        log_path = r"c:\Users\SISTEMAS\Documents\Antigravity Projects\MultillantasNieto\backend\soap_error.log"
        try:
            with open(log_path, "w") as f:
                f.write(error_msg)
            print(f"Log written to {log_path}")
        except Exception as file_err:
             print(f"Failed to write log: {file_err}")
            
        print(error_msg)
        return []

def search_vehicles_soap(client_id: int):
    """
    Busca vehículos de un cliente en SOAP.
    Usa Tp='V'.
    """
    log_file = "debug_log.txt"
    try:
        client_soap = get_soap_client()
        service = client_soap.service
        
        sdt_clientes, sdt_placas_dummy = get_empty_structures()
        sdt_clientes['clicve'] = client_id
        
        with open(log_file, "a") as f:
            f.write(f"[SOAP] Buscando vehículos para cliente {client_id}...\n")
            
        response = service.Execute(
            Criterio="", 
            Sdtclientesnuevo=sdt_clientes, 
            Clicvein=client_id, 
            Placas="", 
            Sdtplacasosnuevo=sdt_placas_dummy, 
            Tp="V"
        )
        
        vehicles = []
        if hasattr(response, 'Sdtplacasos') and response.Sdtplacasos:
             items = []
             if hasattr(response.Sdtplacasos, 'sdtplacasos_Item'):
                  items = response.Sdtplacasos.sdtplacasos_Item
             elif hasattr(response.Sdtplacasos, 'Item'): 
                  items = response.Sdtplacasos.Item
             else:
                  try:
                      items = response.Sdtplacasos['sdtplacasos.Item']
                  except:
                      pass
             
             for item in items:
                 vehicles.append({
                     "placas": getattr(item, 'autplac', ""),
                     "marca": getattr(item, 'autmarca', ""),
                     "modelo": getattr(item, 'autmod', ""),
                     "anio": getattr(item, 'autanio', 0),
                     "color": getattr(item, 'autcolor', ""),
                     "motor": getattr(item, 'autmotor', ""),
                     "serie": getattr(item, 'autserie', "")
                 })
        
        with open(log_file, "a") as f:
            f.write(f"[SOAP] Encontrados {len(vehicles)} vehículos.\n")
                 
        return vehicles

    except Exception as e:
        with open(log_file, "a") as f:
            f.write(f"[SOAP] ERROR en búsqueda de vehículos: {str(e)}\n")
        return []

def register_vehicle_soap(client_id: int, vehicle_data: dict):
    """
    Registra un vehículo en SOAP.
    """
    log_file = "debug_log.txt"
    try:
        client_soap = get_soap_client()
        service = client_soap.service
        
        sdt_clientes_dummy, sdt_placas = get_empty_structures()
        
        veh_modelo_input = str(vehicle_data.get("modelo", ""))
        veh_year = 0
        if veh_modelo_input.isdigit() and len(veh_modelo_input) == 4:
            veh_year = int(veh_modelo_input)
            
        sdt_placas.update({
            "autplac": (vehicle_data.get("placas") or "").upper(),
            "autmarca": (vehicle_data.get("marca") or "").upper(),
            "autmod": (vehicle_data.get("modelo") or "").upper(), 
            "autanio": int(vehicle_data.get("anio", 0) or veh_year),
            "autcolor": (vehicle_data.get("color") or "").upper(),
            "autserie": (vehicle_data.get("serie") or "").upper(),
            "autmotor": (vehicle_data.get("motor") or "").upper() 
        })
        
        with open(log_file, "a") as f:
            f.write(f"[SOAP] Ejecutando registro (Tp='P') para {sdt_placas['autplac']}...\n")
        
        response = service.Execute(
            Criterio="", 
            Sdtclientesnuevo=sdt_clientes_dummy,
            Clicvein=client_id, 
            Placas=sdt_placas["autplac"], 
            Sdtplacasosnuevo=sdt_placas,
            Tp="P"
        )
        
        with open(log_file, "a") as f:
            f.write(f"[SOAP] Respuesta Registro: {str(response)}\n")
        return True 
        
    except Exception as e:
        import traceback
        error_info = traceback.format_exc()
        with open(log_file, "a") as f:
            f.write(f"[SOAP] ERROR en registro de vehículo: {str(e)}\n{error_info}\n")
        return False

def push_client_to_rest(client_data: dict, soap_id: int):
    """
    Sincroniza un cliente recién creado (o actualizado) hacia la API REST externa.
    Realiza una sanitización estricta de los datos exigida por el endpoint externo:
    - RFC: Se eliminan guiones y espacios, convirtiendo a mayúsculas.
    - Régimen Fiscal: Se extraen solo los 3 dígitos iniciales (ej: '601 - General' -> '601').
    
    Maneja respuestas 400 (Duplicate/Integridad) como un caso de éxito (el cliente ya está sincronizado),
    evitando que la aplicación falle (Error 500 en frontend) si se intenta re-sincronizar.
    """
    import requests
    EXTERNAL_API_URL = "http://172.16.71.199:8000/clientes/crear"
    try:
        # Limpieza obligatoria del RFC para la API externa
        rfc_raw = client_data.get("rfc", "")
        rfc_clean = rfc_raw.replace("-", "").replace(" ", "").strip().upper()

        # Limpieza obligatoria del Régimen Fiscal (solo código de 3 dígitos)
        regimen_raw = client_data.get("regimen_fiscal", "601") or "601"
        regimen_code = regimen_raw.split(" - ")[0] if " - " in regimen_raw else regimen_raw
        
        # Mapeo de datos usando PascalCase requerido por FastAPI externo
        payload = {
            "ClienteClave": str(soap_id), 
            "ClienteNombre": client_data.get("nombre", ""),
            "ClienteRazon": client_data.get("razon_social") or client_data.get("nombre") or "GENERICA",
            "ClienteRegimen": regimen_code,
            "ClienteRFC": rfc_clean,
            "ClienteDomicilio": client_data.get("domicilio", ""),
            "ClienteDomicilio2": client_data.get("domicilio2") or "Col. Centro",
            "ClienteCiudad": client_data.get("ciudad", "Celaya"),
            "ClienteEstadoClave": (client_data.get("estado") or "GTO")[:3].upper(), 
            "ClienteEstadoNombre": client_data.get("estado", "Guanajuato"),
            "ClienteCP": client_data.get("cp", "38000"),
            "ClienteCategoria": "1",
            "ClienteDiasCredito": 0,
            "ClienteIDGen": str(soap_id) 
        }
        print(f"[REST Push] Enviando a {EXTERNAL_API_URL} con ID {soap_id}...")
        response = requests.post(EXTERNAL_API_URL, json=payload, headers={'Content-Type': 'application/json'}, timeout=5)
        print(f"[REST Push] Respuesta {response.status_code}: {response.text}")
        
        with open("debug_log.txt", "a") as f:
            f.write(f"[REST] Payload: {payload}\n")
            f.write(f"[REST] Response Code: {response.status_code}\n")
            f.write(f"[REST] Response Body: {response.text}\n")
            
        # 200/201: Éxito en la creación.
        # 400: Frecuentemente significa entrada duplicada en esta API específica, 
        # lo tratamos como "ya sincronizado" para no bloquear el flujo.
        if response.status_code in [200, 201]:
            return True
        if response.status_code == 400 and ("Duplicate" in response.text or "IntegrityError" in response.text or "ya existe" in response.text.lower()):
            print(f"[REST Push] Cliente ya existe (400 Duplicate), considerando sincronizado.")
            return True
            
        return False
    except Exception as e:
        print(f"[REST Push] Falló: {e}")
        with open("debug_log.txt", "a") as f:
            f.write(f"[REST] EXCEPTION: {str(e)}\n")
        return False
 

    except Exception as e:
        print(f"Error searching SOAP: {e}")
        return []

def create_order_soap(payload: dict) -> dict:
    """
    Consumer function for `awsoservicio` SOAP endpoint.
    Recieves the Mega-Payload dictionaries and maps them to `SDToservicio`.
    Calls Execute(Tp="N") to create the record in Genexus and returns Ordser, Ordnum.
    """
    WSDL_OS_URL = "http://172.16.71.204:8080/mllntqa/servlet/awsoservicio?WSDL"
    
    try:
        from zeep import Client, Settings
        from zeep.transports import Transport
        from requests import Session
        import datetime
        
        session = Session()
        session.verify = False 
        transport = Transport(session=session)
        session.adapters['http://'].max_retries = 3
        settings = Settings(strict=False, xml_huge_tree=True)
        
        client = Client(WSDL_OS_URL, transport=transport, settings=settings)
        service = client.service
        
        orden_data = payload.get("Orden", {})
        cliente_data = payload.get("Cliente", {})
        vehiculo_data = payload.get("Vehiculo", {})
        
        # Format dates properly
        # Default to now if not provided
        fecha_str = orden_data.get("OrdenFechaIngreso") or datetime.datetime.now().isoformat()
        try:
            # Parse robustly and handle naive/aware
            dt = datetime.datetime.fromisoformat(fecha_str.replace("Z", "+00:00"))
            fecha_soap = dt.replace(tzinfo=None) # Zeep prefers naive or explicit
        except Exception:
            # Fallback
            fecha_soap = datetime.datetime.now()

        # Construction of the SDT object using the introspected type
        # Or did nube: ID generated by step 1
        # PATIOCVE and APISOCVE could be standard 1 or derived.
        sdt_os = {
            "ordidnube": int(orden_data.get("OrdenID") or 0),
            "ordser": "",  # To be filled by output
            "ordnum": 0,   # To be filled by output
            "patiocve": int(orden_data.get("SucursalID") or 1), 
            "ordtord": "1" if orden_data.get("OrdenTipo") == "1" else "2",
            "fechaent": fecha_soap,
            "fechaprom": fecha_soap,
            "ordplac": vehiculo_data.get("VehiculoPlacas", ""),
            "ordmarca": vehiculo_data.get("VehiculoMarca", "")[:50],  # safety cutoffs
            "ordmod": vehiculo_data.get("VehiculoModelo", "")[:50],
            "ordanio": int(vehiculo_data.get("VehiculoModelo", "2020")[-4:] if str(vehiculo_data.get("VehiculoModelo", "")[-4:]).isdigit() else 2026),
            "ordcolor": vehiculo_data.get("VehiculoColor", "")[:30],
            "ordkm": int(vehiculo_data.get("VehiculoKilometraje") or 0),
            "ordobs": orden_data.get("OrdenObservaciones", "")[:250],
            "ordtasaiva": 16, # default mexico
            "apisocve": int(orden_data.get("AsesorID") or 0),
            "clicve": int(cliente_data.get("ClienteIDGen") or cliente_data.get("ClienteClave") or 0)
        }
        
        print(f"[SOAP] Llamando awsoservicio Tp='A' con data: {sdt_os}")
        
        response = service.Execute(
            Tp="A",
            Sdtoservicio=sdt_os
        )
        
        print(f"[SOAP] WSOServicio Respuesta OK: {response}")
        
        # Zeep returns an object, not a dict. We must use getattr safely.
        ordser = getattr(response, "Ordser", getattr(response, "ordser", ""))
        ordnum = getattr(response, "Ordnum", getattr(response, "ordnum", 0))
        
        return {
            "success": True,
            "Ordser": ordser,
            "Ordnum": ordnum
        }
        
    except Exception as e:
        print(f"[SOAP] ERROR en WSOServicio: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }
