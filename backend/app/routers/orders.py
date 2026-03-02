from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import database, models, schemas
from .. import auth as auth_module

router = APIRouter(
    prefix="/orders",
    tags=["Service Orders"],
    # dependencies=[Depends(auth_module.get_current_user)]
)

@router.post("/", response_model=schemas.ServiceOrder)
@router.post("/", response_model=schemas.ServiceOrder)
def create_service_order(order: schemas.ServiceOrderCreate, db: Session = Depends(database.get_db)):
    """
    Crea una nueva orden de servicio con sus detalles.
    """
    # 1. Crear encabezado de la Orden
    new_order_data = order.dict(exclude={"detalles"})
    db_order = models.ServiceOrder(**new_order_data)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # 2. Agregar Detalles (items)
    for detail in order.detalles:
        # Calcular subtotal si no se provee (aunque el frontend debería enviarlo)
        importe = detail.cantidad * detail.precio_venta
        subtotal = importe - detail.descuento
        
        new_detail = models.OrderDetail(
            orden_id=db_order.id,
            origen=detail.origen,
            clave=detail.clave,
            nombre=detail.nombre,
            cantidad=detail.cantidad,
            precio_venta=detail.precio_venta,
            importe=importe,
            descuento=detail.descuento,
            subtotal=subtotal
        )
        db.add(new_detail)
    
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/", response_model=List[schemas.ServiceOrder])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    orders = db.query(models.ServiceOrder).offset(skip).limit(limit).all()
    return orders

@router.get("/next-id")
def get_next_order_id(
    sucursal_id: Optional[str] = None, 
    usuario_id: Optional[str] = None, 
    asesor_id: Optional[str] = None
):
    print(f"DEBUG: get_next_order_id called with sucursal_id={sucursal_id}, usuario_id={usuario_id}, asesor_id={asesor_id}")
    """
    Consulta al servicio externo http://172.16.71.199:8000/orden/crear
    para obtener el siguiente ID de Orden disponible o recuperar una pendiente.
    """
    import requests
    EXTERNAL_API_URL = "http://172.16.71.199:8000/orden/crear"
    
    # Mapping logic for different IDs between local and external systems
    # User Jorge: Local ID 2 -> External ID 1
    ext_usuario_id = str(usuario_id) if usuario_id else "1"
    ext_asesor_id = str(asesor_id) if asesor_id else "1"
    
    if ext_usuario_id == "2":
        print("[Proxy] Mapping local UsuarioID 2 to external 1 for Jorge")
        ext_usuario_id = "1"
    if ext_asesor_id == "2":
        ext_asesor_id = "1"

    payload = {
        "SucursalID": str(sucursal_id) if sucursal_id else "1",
        "UsuarioID": ext_usuario_id,
        "AsesorID": ext_asesor_id
    }
    
    try:
        print(f"[Proxy] Fetching/Creating Order with payload: {payload}")
        response = requests.post(EXTERNAL_API_URL, timeout=30, json=payload)
        print(f"[Proxy] Response {response.status_code}: {response.text[:500]}")
        
        if response.status_code == 200:
            return response.json()
        else:
             raise HTTPException(
                 status_code=response.status_code, 
                 detail=f"External API Error {response.status_code}: {response.text[:200]}"
             )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Proxy Exception: {str(e)}")

@router.post("/actualizar")
def update_service_order_external(payload: dict):
    """
    Proxy para actualizar la orden en el servicio externo.
    URL: http://172.16.71.199:8000/orden/actualizar
    """
    import requests
    EXTERNAL_UPDATE_URL = "http://172.16.71.199:8000/orden/actualizar"
    try:
        print(f"[Proxy] Actualizando Orden en {EXTERNAL_UPDATE_URL} con payload: {payload}")
        response = requests.post(EXTERNAL_UPDATE_URL, json=payload, timeout=30)
        print(f"[Proxy] Respuesta Actualización {response.status_code}: {response.text}")
        return response.json()
    except Exception as e:
        print(f"[Proxy] Error al Actualizar: {e}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar orden externa: {str(e)}")

@router.get("/pending", response_model=schemas.ServiceOrderFull)
def get_pending_order(
    sucursal_id: Optional[int] = None, 
    usuario_id: Optional[int] = None,
    db: Session = Depends(database.get_db)
):
    # Check for open orders using both "Abierta" and "A" as per user requirements
    query = db.query(models.ServiceOrder).filter(models.ServiceOrder.estatus.in_(["Abierta", "A"]))
    
    # sucursal_id is not in models.ServiceOrder, so we skip it.
    if usuario_id:
        query = query.filter(models.ServiceOrder.asesor_id == usuario_id)
        
    order = query.order_by(models.ServiceOrder.id.desc()).first()
    
    if order:
        return order
    else:
        raise HTTPException(status_code=404, detail="No pending order found")

@router.get("/{order_id}", response_model=schemas.ServiceOrder)
def read_order(order_id: int, db: Session = Depends(database.get_db)):
    order = db.query(models.ServiceOrder).filter(models.ServiceOrder.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

@router.post("/listar")
def get_external_order_list(payload: dict):
    """
    Proxy para consumir la lista de órdenes o el detalle de una en concreto
    URL: http://172.16.71.199:8000/orden/listar
    Recibe payload del frontend con un diccionario genérico que puede traer OrdenID o no.
    """
    import requests
    EXTERNAL_LIST_URL = "http://172.16.71.199:8000/orden/listar"
    
    # Extraemos el id si viene
    ext_payload = {}
    orden_id = payload.get("OrdenID")
    if orden_id is not None:
        ext_payload["OrdenID"] = str(orden_id)

    try:
        print(f"[Proxy] Consultando Lista de Órdenes en {EXTERNAL_LIST_URL} con payload: {ext_payload}")
        response = requests.post(EXTERNAL_LIST_URL, json=ext_payload, timeout=10)
        print(f"[Proxy] Respuesta Listar {response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail=f"External API Error: {response.text}")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Timeout while connecting to external service")
    except Exception as e:
        print(f"[Proxy] Error en Listar: {e}")
        raise HTTPException(status_code=500, detail=f"Error al consultar órdenes externas: {str(e)}")



@router.put("/{order_id}/cancel", response_model=schemas.ServiceOrder)
def cancel_service_order(order_id: int, db: Session = Depends(database.get_db)):
    """
    Cancela una orden de servicio.
    1. Actualiza estado localmente a "C".
    2. Notifica al servicio externo de la cancelación.
    """
    order = db.query(models.ServiceOrder).filter(models.ServiceOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    # 1. Actualizar estado local
    order.estatus = "C" 
    db.commit()
    db.refresh(order)

    # 2. Notificar servicio externo
    import requests
    EXTERNAL_CANCEL_URL = "http://172.16.71.199:8000/orden/cancelar"
    try:
        # Se envía el OrdenID as string. Note: External service returned 422 with lowercase 'ordenid',
        # demanding uppercase 'OrdenID' in the error response.
        payload = {"OrdenID": str(order.no_orden)} 
        print(f"[Proxy] Cancelando Orden {order.no_orden} en {EXTERNAL_CANCEL_URL}")
        # Note: User provided http://localhost:3000/api/orden/cancelar but later showed response for success: false
        # The URL in previous snippet was 8000/orden/cancelar. I will use the 172...199:8000 one as it seems to be the new set.
        response = requests.post(EXTERNAL_CANCEL_URL, json=payload, timeout=5)
        print(f"[Proxy] Respuesta Cancelación {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[Proxy] Error al Cancelar: {e}")
        # No hacemos rollback si falla el externo, pero lo logueamos.

    return order
