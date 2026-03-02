# Importación de librerías necesarias de FastAPI y otras utilidades
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import requests
from . import models, database
from .routers import auth, clients, vehicles, orders

# Crear las tablas en la base de datos si no existen (usando SQLAlchemy)
models.Base.metadata.create_all(bind=database.engine)

# Inicializar la aplicación FastAPI con un título descriptivo
app = FastAPI(title="Sistema de Talleres API")

# Configuración de CORS (Cross-Origin Resource Sharing)
# Esto permite que el frontend (que corre en otro puerto) pueda hacer peticiones a este backend
origins = [
    "http://localhost:8081",
    "http://localhost:8000",
    "http://localhost:8002",
    "http://localhost",
    "http://172.16.71.200:8081",
    "http://172.16.71.200:3000",
    "http://172.16.71.199:3000",
    "http://172.16.71.199",
    "*", # Permitir todos los orígenes (útil para desarrollo, cuidado en producción)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permitir todos los métodos HTTP (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"], # Permitir todos los encabezados
)

# Incluir las rutas (endpoints) de los diferentes módulos
app.include_router(auth.router)     # Rutas de autenticación
app.include_router(clients.router)  # Rutas de clientes
app.include_router(vehicles.router) # Rutas de vehículos
app.include_router(orders.router)   # Rutas de órdenes de servicio

@app.post("/api/proxy/upload")
async def proxy_upload(
    foto: UploadFile = File(...), 
    tipo: str = Form("a"), 
    ordenid: str = Form(None)
):
    """
    Endpoint proxy para subir fotos al nuevo servidor externo (/evidencias/nueva).
    """
    try:
        # Definir la URL destino del servidor externo
        target_url = "http://172.16.71.199:8000/evidencias/nueva"
        
        # Leer el contenido del archivo subido
        file_content = await foto.read()
        
        # Preparar el archivo para la petición (multipart/form-data)
        files = {'foto': (foto.filename, file_content, foto.content_type)}
        
        # Preparar los datos adicionales mapeados a los nuevos nombres
        data = {'tipoevidenciaclave': tipo}
        if ordenid:
            data['ordenid'] = ordenid
            
        # Reenviar la petición al servidor externo
        print(f"Haciendo proxy de subida para {foto.filename} (Tipo: {tipo}, Orden: {ordenid}) a {target_url}")
        
        # Usar un timeout para evitar que se quede colgado si el otro servidor no responde
        response = requests.post(target_url, files=files, data=data, timeout=90)
        
        # Retornar la respuesta tal cual la envió el servidor externo
        try:
            return response.json()
        except:
            return {"ok": False, "error": "Respuesta JSON inválida del destino", "text": response.text}
            
    except Exception as e:
        print(f"Error en el proxy upload: {e}")
        return {"ok": False, "error": str(e)}

# --- PROXIES PARA INSPECCIÓN (DINÁMICO) ---

@app.post("/api/inspeccion/valoracion")
async def proxy_get_catalogo_inspeccion():
    """
    Proxy para obtener el catálogo dinámico de inspección (Puntos a revisar).
    URL Actualizada: http://172.16.71.199:8000/valoraciones/listar
    """
    target_url = "http://172.16.71.199:8000/valoraciones/listar"
    log_file = "debug_log.txt"
    
    try:
        with open(log_file, "a") as f:
            f.write(f"\n[Proxy] Consultando Catálogo Oficial en {target_url}...\n")
        
        # El servicio ahora responde en el puerto 8000 por POST
        response = requests.post(target_url, json={}, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            with open(log_file, "a") as f:
                f.write(f"[Proxy] Éxito. Secciones obtenidas: {len(data.get('tiposValoracion', []))}\n")
            return data
            
        with open(log_file, "a") as f:
            f.write(f"[Proxy] Error de Servicio: {response.status_code}\n")
        return {"success": False, "error": f"Servicio de valoraciones retornó status {response.status_code}"}

    except Exception as e:
        with open(log_file, "a") as f:
            f.write(f"[Proxy] EXCEPCIÓN en catálogo: {str(e)}\n")
        return {"success": False, "error": f"No se pudo conectar con el servicio de inspección: {str(e)}"}

@app.post("/api/orden/finalizar_proceso")
async def proxy_finalizar_proceso(payload: dict):
    """
    Orquesta el flujo final de 2 pasos.
    Paso 1: POST a ingresos/crear (REST)
    Paso 2: Si éxito, POST a awosservicio (SOAP)
    """
    target_rest_url = "http://172.16.71.199:8000/ingresos/crear"
    log_file = "debug_log.txt"
    try:
        with open(log_file, "a") as f:
            f.write(f"\n[Finalizar] Paso 0: Iniciando validación de Borrador...\n")
            
        # STEP 0: DRAFT CLEANUP
        # The REST endpoint /ingresos/crear performs a strict INSERT. If the draft from Step 1 is still open, it triggers 
        # a '1062 Duplicate entry uq_orden_abierta' constraint. We must close the draft before inserting the Mega Payload.
        orden_data = payload.get("Orden") or {}
        draft_id = orden_data.get("OrdenID")
        
        if draft_id and str(draft_id) != "0" and str(draft_id).lower() != "null":
            try:
                cleanup_url = "http://172.16.71.199:8000/orden/actualizar"
                cleanup_payload = {
                    "OrdenID": str(draft_id),
                    "SucursalID": str(orden_data.get("SucursalID") or 1),
                    "UsuarioID": str(orden_data.get("UsuarioID") or 1),
                    "AsesorID": str(orden_data.get("AsesorID") or 1),
                    "OrdenEstatus": "C", 
                    "Estatus": "C"
                }
                cleanup_resp = requests.post(cleanup_url, json=cleanup_payload, timeout=10)
                with open(log_file, "a") as f:
                    f.write(f"[Finalizar] Paso 0: Borrador {draft_id} limpiado (Cerrado). HTTP {cleanup_resp.status_code}\n")
            except Exception as e:
                with open(log_file, "a") as f:
                    f.write(f"[Finalizar] Aviso Paso 0: Fallo al limpiar borrador: {e}\n")
                    
        # Orquestación: Asegurarnos de limpiar el OrdenID del borrador 
        # para que el backend externo (/ingresos/crear) lo inserte como un nuevo registro consolidado.
        if "Orden" in payload and payload["Orden"]:
            payload["Orden"]["OrdenID"] = None
            
        with open(log_file, "a") as f:
            f.write(f"[Finalizar] Paso 1: Iniciando REST a {target_rest_url}\n")
            
        # STEP 1: REST POST
        response_rest = requests.post(target_rest_url, json=payload, timeout=45)
        
        with open(log_file, "a") as f:
            f.write(f"[Finalizar] Paso 1 Respuesta: {response_rest.status_code}\n")
            
        try:
            rest_data = response_rest.json()
            with open(log_file, "a") as f:
                import json
                f.write(f"[Finalizar] Respuesta JSON: {json.dumps(rest_data)}\n")
        except Exception as json_e:
            with open(log_file, "a") as f:
                 f.write(f"[Finalizar] No se pudo parsear JSON. Raw: {response_rest.text}\n")
            return {"success": False, "step": "REST", "error": f"Invalid JSON response: {str(json_e)}"}
        
        if not rest_data.get("success") and rest_data.get("status") != "success" and rest_data.get("mensaje") != "exito":
            if rest_data.get("error") or rest_data.get("success") is False:
                return {
                    "success": False, 
                    "step": "REST", 
                    "error": rest_data.get("error") or rest_data.get("message") or "Error desconocido en creación REST",
                    "details": rest_data
                }
            
        # Si la API REST devuelve un OrdenID válido y diferente, actualizamos el payload para SOAP.
        # Evitamos sobrescribir si viene en nulo por un error de validación (ej. el Duplicate bug).
        if "OrdenID" in rest_data and rest_data["OrdenID"] is not None:
             if "Orden" not in payload: payload["Orden"] = {}
             payload["Orden"]["OrdenID"] = rest_data["OrdenID"]
             
        # STEP 2: SOAP EXECUTION
        from app.services.soap_client import create_order_soap
        
        with open(log_file, "a") as f:
            f.write(f"[Finalizar] Paso 2: Iniciando SOAP awsoservicio\n")
            
        soap_result = create_order_soap(payload)
        
        with open(log_file, "a") as f:
            f.write(f"[Finalizar] Paso 2 Finalizado: {soap_result}\n")
            
        if not soap_result.get("success"):
             return {
                 "success": False,
                 "step": "SOAP",
                 "error": soap_result.get("error", "Error insertando la orden física en SOAP"),
                 "rest_response": rest_data
             }
             
        # STEP 3: Update REST with the shiny new SOAP Ordnum (Opción 2)
        try:
            target_update_url = "http://172.16.71.199:8000/orden/actualizar"
            orden_base = payload.get("Orden", {})
            update_payload = {
                "OrdenID": rest_data.get("OrdenID") or orden_base.get("OrdenID"),
                "OrdenIDGen": str(soap_result.get("Ordnum", "")),
                "SucursalID": orden_base.get("SucursalID", 1),
                "UsuarioID": orden_base.get("UsuarioID", 1),
                "AsesorID": orden_base.get("AsesorID", 1),
                "OrdenEstatus": "C"
            }
            with open(log_file, "a") as f:
                f.write(f"[Finalizar] Paso 3: Sincronizando Ordnum a REST: {update_payload}\n")
            
            requests.post(target_update_url, json=update_payload, timeout=20)
        except Exception as e:
            with open(log_file, "a") as f:
                f.write(f"[Finalizar] Advertencia: Fallo la sincronizacion del Paso 3: {e}\n")
             
        return {
            "success": True,
            "message": "Orden finalizada completamente",
            "rest_data": rest_data,
            "soap_data": soap_result
        }
        
    except Exception as e:
        with open(log_file, "a") as f:
            f.write(f"[Finalizar] EXCEPCIÓN crítica doble guardado: {str(e)}\n")
            import traceback
            f.write(traceback.format_exc() + "\n")
        return {"success": False, "error": f"Error del sistema: {str(e)}"}

@app.post("/api/orden/guardar_total")
async def proxy_save_order_total(payload: dict):
    """
    Proxy para guardar la orden consolidada (Mega-Payload).
    URL: http://172.16.71.199:8000/orden/guardar_total
    """
    target_url = "http://172.16.71.199:8000/orden/guardar_total"
    log_file = "debug_log.txt"
    try:
        with open(log_file, "a") as f:
            f.write(f"\n[Proxy] Enviando Payload Consolidado a {target_url}...\n")
        
        response = requests.post(target_url, json=payload, timeout=45)
        
        with open(log_file, "a") as f:
            f.write(f"[Proxy] Respuesta Guardado (Status: {response.status_code})\n")
            
        return response.json()
    except Exception as e:
        with open(log_file, "a") as f:
            f.write(f"[Proxy] EXCEPCIÓN al guardar total: {str(e)}\n")
        return {"success": False, "error": str(e)}

@app.post("/api/inspeccion/guardar")
async def proxy_save_inspeccion(payload: list):
    """
    Proxy para guardar los resultados de la inspección en el servidor remoto.
    """
    target_url = "http://172.16.71.199:3000/api/inspeccion/guardar"
    log_file = "debug_log.txt"
    try:
        with open(log_file, "a") as f:
            f.write(f"\n[Proxy] Guardando Inspección ({len(payload)} items) en {target_url}...\n")
        response = requests.post(target_url, json=payload, timeout=20)
        with open(log_file, "a") as f:
            f.write(f"[Proxy] Guardado Realizado (Status: {response.status_code})\n")
        return response.json()
    except Exception as e:
        with open(log_file, "a") as f:
            f.write(f"[Proxy] EXCEPCIÓN Crítica al guardar: {str(e)}\n")
        return {"success": False, "error": str(e)}

@app.get("/")
def read_root():
    # Endpoint raíz para verificar que la API está viva
    return {"message": "Sistema de Talleres API is running"}
