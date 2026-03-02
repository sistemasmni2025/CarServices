from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
from .. import database, models, schemas, auth

router = APIRouter(
    prefix="/clients",
    tags=["Clients"],
    # dependencies=[Depends(auth.get_current_user)] 
)

@router.post("/", response_model=schemas.Client)
def create_client(client: schemas.ClientCreate, db: Session = Depends(database.get_db)):
    """
    Crea un nuevo cliente.
    1. Guarda en BD local.
    2. Lo envía al servicio SOAP (Genexus).
    3. Si SOAP responde con ID, lo envía al servicio REST para sincronizar.
    """
    # Validar código duplicado solo si se provee uno
    if client.codigo:
        db_client = db.query(models.Client).filter(models.Client.codigo == client.codigo).first()
        if db_client:
            raise HTTPException(status_code=400, detail="Ya existe un cliente con este código")
    
    # Separar datos del vehículo si vienen anidados
    vehicle_data = client.vehiculo
    client_data = client.dict(exclude={"vehiculo"})
    
    # Crear Cliente en BD Local
    new_client = models.Client(**client_data)
    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    # Crear Vehículo asociado si venía en la petición
    if vehicle_data:
        new_vehicle = models.Vehicle(**vehicle_data.dict(), cliente_id=new_client.id)
        db.add(new_vehicle)
        db.commit()
    
    # Integración con Servicios Externos (SOAP y REST)
    try:
        from ..services import soap_client
        # Enviar a SOAP y obtener el nuevo ID (Clicve)
        new_soap_id = soap_client.send_client_to_soap(client, new_client.id)
        
        if new_soap_id and int(new_soap_id) > 0:
            # Encadenamiento: Empujar al servicio REST con el nuevo ID generado por SOAP
            print(f"Encadenando: Enviando a REST con ID {new_soap_id}...")
            soap_client.push_client_to_rest(client_data, new_soap_id)
            
    except Exception as e:
        print(f"ADVERTENCIA: Falló el envío a SOAP o REST: {e}")
        # No detenemos el flujo, solo lo logueamos. El cliente ya se guardó localmente.
        pass
    
    return new_client

@router.get("/", response_model=List[schemas.Client])
def read_clients(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    clients = db.query(models.Client).offset(skip).limit(limit).all()
    return clients

@router.get("/search", response_model=List[schemas.Client])
def search_clients(q: str, db: Session = Depends(database.get_db)):
    """
    Busca clientes por nombre, RFC o código.
    Combina resultados de la BD Local y del servicio SOAP externo.
    """
    log_msg = f"--- ROUTER: search_clients(q='{q}') ---\n"
    try:
        # 1. Búsqueda Local
        print("Consultando BD Local...")
        clients = db.query(models.Client).filter(
            (models.Client.nombre.ilike(f"%{q}%")) | 
            (models.Client.rfc.ilike(f"%{q}%")) |
            (models.Client.codigo.ilike(f"%{q}%"))
        ).all()
        print(f"Resultados Locales: {len(clients)}")

        # 2. Búsqueda SOAP (Externa)
        q_upper = q.upper()
        from ..services import soap_client
        log_msg += "Llamando a soap_client...\n"
        soap_results = soap_client.search_clients_soap(q_upper)
        log_msg += f"Resultados SOAP: {len(soap_results)}\n"
        print(f"Resultados SOAP: {len(soap_results)}")
        
        # 3. Combinar resultados (Evitando duplicados por ID)
        if soap_results:
            existing_ids = {str(c.id) for c in clients} 
            
            for res in soap_results:
                 soap_id_str = res.get("id", "0")
                 if soap_id_str not in existing_ids:
                     # Convertir ID a entero de forma segura
                     try:
                         temp_id = int(soap_id_str)
                     except:
                         temp_id = 0
                         
                     # Construir diccionario que coincida con el esquema Client
                     client_dict = {
                         "id": temp_id,
                         "codigo": res.get("codigo", ""),
                         "nombre": res.get("nombre", ""),
                         "razon_social": res.get("razon_social", ""),
                         "rfc": res.get("rfc", ""),
                         "regimen_fiscal": res.get("regimen_fiscal", ""),
                         "domicilio": res.get("domicilio", ""),
                         "ciudad": res.get("ciudad", ""),
                         "estado": res.get("estado", ""),
                         "cp": res.get("cp", ""),
                         "condiciones_pago": res.get("condiciones_pago", "") or "0", 
                         "estado_catalogo": "Activo",
                         # Campos opcionales vacíos por defecto
                         "telefono": "",
                         "email": "",
                         "asesor": "",
                         "domicilio2": "",
                         "categoria": "",
                         "vehicles": []
                     }
                     clients.append(client_dict) 

        log_msg += f"Clientes Totales retornados: {len(clients)}\n"
        
        # Escribir log de depuración
        with open("router_debug.log", "a") as f:
            f.write(log_msg + "\n")
            
        print(f"Clientes Totales retornados: {len(clients)}")
        return clients[:50] # Limitar a 50 resultados

    except Exception as e:
        print(f"ERROR CRÍTICO en search_clients: {e}")
        import traceback
        traceback.print_exc()
        # Retornar lista vacía en caso de crash para no romper el frontend
        return []

@router.get("/{client_id}", response_model=schemas.Client)
def read_client(client_id: int, db: Session = Depends(database.get_db)):
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.post("/sync")
def sync_client_external(client_data: dict = Body(...), db: Session = Depends(database.get_db)):
    """
    Sincroniza un cliente con el servidor externo (REST) y lo guarda
    completamente en la base de datos local para evitar fallos 404 en el futuro.
    """
    from ..services import soap_client
    
    print(f"[Sync] Recibidos datos para sync: {client_data}")
    
    # 1. Intentar resolver el ID SOAP
    soap_id = "0"
    
    # Priorizar ID que venga en los datos
    provided_id = client_data.get("clienteidgen") or client_data.get("id") or client_data.get("codigo")
    if provided_id and str(provided_id) != "0" and str(provided_id).isdigit():
        soap_id = str(provided_id)
        print(f"[Sync] Usando ID provisto: {soap_id}")
    else:
        try:
            # Intentar búsqueda por RFC
            rfc = client_data.get("rfc", "")
            if rfc and len(rfc) > 3:
                print(f"[Sync] Buscando por RFC: {rfc}")
                results = soap_client.search_clients_soap(rfc)
                if results:
                    if len(results) > 0 and 'id' in results[0]:
                        soap_id = str(results[0]['id'])
                        print(f"[Sync] Encontrado por RFC: {soap_id}")
                    
            # Intentar búsqueda por Nombre si aún no tenemos ID
            if soap_id == "0":
                nombre = client_data.get("nombre", "")
                if nombre:
                    print(f"[Sync] Buscando por Nombre: {nombre}")
                    results = soap_client.search_clients_soap(nombre)
                    if results:
                        if len(results) > 0 and 'id' in results[0]:
                            soap_id = str(results[0]['id'])
                            print(f"[Sync] Encontrado por Nombre: {soap_id}")
        except Exception as e:
            print(f"[Sync] Advertencia en búsqueda SOAP: {e}")
            pass
                
    # 2. Empujar a REST usando el helper
    try:
        with open("debug_log.txt", "a") as f:
            f.write(f"\n[SYNC] Triggered for Client: {client_data.get('nombre')} (ID provided: {provided_id}, Resolved SOAP ID: {soap_id})\n")
        
        success = soap_client.push_client_to_rest(client_data, soap_id)
        
        if success:
            with open("debug_log.txt", "a") as f:
                f.write(f"[SYNC] Success for ID: {soap_id}\n")

            # 3. Guardar en Base de Datos Local la información del Cliente
            if str(soap_id) != "0":
                existing_local = db.query(models.Client).filter(
                    (models.Client.codigo == str(soap_id)) |
                    (models.Client.id == int(soap_id) if str(soap_id).isdigit() else False)
                ).first()

                if not existing_local:
                    with open("debug_log.txt", "a") as f:
                        f.write(f"[SYNC] Insertando cliente {soap_id} en BD local...\n")
                    new_local_client = models.Client(
                        codigo=str(soap_id),
                        nombre=client_data.get("nombre", ""),
                        razon_social=client_data.get("razon_social") or client_data.get("nombre", ""),
                        rfc=client_data.get("rfc", ""),
                        regimen_fiscal=client_data.get("regimen_fiscal", ""),
                        domicilio=client_data.get("domicilio", ""),
                        cp=client_data.get("cp", ""),
                        ciudad=client_data.get("ciudad", ""),
                        estado=client_data.get("estado", ""),
                        telefono=client_data.get("telefono", ""),
                        email=client_data.get("email", ""),
                        condiciones_pago=client_data.get("condiciones_pago", ""),
                        estado_catalogo="Activo"
                    )
                    db.add(new_local_client)
                    db.commit()

            return {"success": True, "clienteidgen": soap_id}
        else:
            with open("debug_log.txt", "a") as f:
                f.write(f"[SYNC] FAILED for ID: {soap_id}. push_client_to_rest returned False.\n")
            raise HTTPException(status_code=500, detail="Fallo al sincronizar con servicio externo")
    except Exception as e:
        with open("debug_log.txt", "a") as f:
            f.write(f"[SYNC] EXCEPTION: {str(e)}\n")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

