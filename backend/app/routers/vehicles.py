from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from .. import database, models, schemas, auth
from ..services import soap_client

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)

class VehicleSOAPRegister(BaseModel):
    client_id: int
    placas: str
    marca: str
    modelo: str # Can be Year (2001) or Model Name
    anio: Optional[int] = 0
    color: Optional[str] = ""
    serie: Optional[str] = ""
    motor: Optional[str] = ""

@router.post("/", response_model=schemas.Vehicle)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(database.get_db)):
    """
    Registra un vehículo en la base de datos local.
    Verifica que el cliente exista y que las placas no estén duplicadas.
    """
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.placas == vehicle.placas).first()
    if db_vehicle:
        raise HTTPException(status_code=400, detail="Ya existe un vehículo con estas placas")
    
    # Verificar que el cliente existe
    db_client = db.query(models.Client).filter(models.Client.id == vehicle.cliente_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    new_vehicle = models.Vehicle(**vehicle.dict())
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

@router.get("/client/{cliente_id}", response_model=List[schemas.Vehicle])
def read_vehicles_by_client(cliente_id: int, db: Session = Depends(database.get_db)):
    vehicles = db.query(models.Vehicle).filter(models.Vehicle.cliente_id == cliente_id).all()
    return vehicles

@router.get("/soap/search/{client_id}")
def search_vehicles_soap_proxy(client_id: int):
    """
    Busca vehículos en el servicio SOAP externo para un cliente dado (Tp='V').
    Retorna la lista de vehículos que el cliente tiene registrados en el sistema externo.
    """
    try:
        with open("debug_log.txt", "a") as f:
            f.write(f"\n[ROUTER] Search Triggered for Client ID: {client_id}\n")
        vehicles = soap_client.search_vehicles_soap(client_id)
        with open("debug_log.txt", "a") as f:
            f.write(f"[ROUTER] Found {len(vehicles)} vehicles for client {client_id}\n")
            f.write(str(vehicles) + "\n")
        return vehicles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/soap/register")
def register_vehicle_soap_proxy(vehicle_data: VehicleSOAPRegister, db: Session = Depends(database.get_db)):
    """
    Registra un vehículo en SOAP (Tp='P') y luego lo sincroniza en BD Local.
    """
    log_file = "debug_log.txt"
    try:
        with open(log_file, "a") as f:
            f.write(f"\n[Vehicles] Intentando registro SOAP para Cliente {vehicle_data.client_id} (Placas: {vehicle_data.placas})\n")
            
        # 1. Registrar en SOAP
        success = soap_client.register_vehicle_soap(vehicle_data.client_id, vehicle_data.dict())
        
        with open(log_file, "a") as f:
            f.write(f"[Vehicles] Resultado SOAP: {success}\n")
            
        if not success:
             raise HTTPException(status_code=500, detail="Fallo al registrar vehículo en servicio externo (SOAP)")
        
        # 2. Sincronizar a BD Local
        local_client = db.query(models.Client).filter(
            (models.Client.id == vehicle_data.client_id) | 
            (models.Client.codigo == str(vehicle_data.client_id))
        ).first()

        if not local_client:
            with open(log_file, "a") as f:
                f.write(f"[Vehicles] ERROR: Cliente local {vehicle_data.client_id} no encontrado.\n")
            raise HTTPException(status_code=404, detail=f"Cliente local {vehicle_data.client_id} no encontrado.")

        # Verificar si el vehículo ya existe localmente
        existing = db.query(models.Vehicle).filter(models.Vehicle.placas == vehicle_data.placas.upper()).first()
        
        local_vehicle = None
        if not existing:
            with open(log_file, "a") as f:
                f.write(f"[Vehicles] Creando registro local...\n")
            new_v = models.Vehicle(
                cliente_id=local_client.id,
                placas=vehicle_data.placas.upper(),
                marca=vehicle_data.marca.upper(),
                modelo=str(vehicle_data.modelo).upper(),
                anio=vehicle_data.anio or 0,
                color=vehicle_data.color.upper(),
                no_serie=vehicle_data.serie.upper(),
                km=0,
                imagen=""
            )
            db.add(new_v)
            db.commit()
            db.refresh(new_v)
            local_vehicle = new_v
        else:
            with open(log_file, "a") as f:
                f.write(f"[Vehicles] Vehículo ya existe localmente (ID: {existing.id})\n")
            local_vehicle = existing
            
        return {"status": "success", "local_id": local_vehicle.id, "soap_success": True}
        
    except Exception as e:
        import traceback
        error_info = traceback.format_exc()
        with open(log_file, "a") as f:
            f.write(f"[Vehicles] EXCEPCIÓN: {str(e)}\n{error_info}\n")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/catalog/unique", response_model=List[schemas.VehicleBase])
def get_vehicle_catalog(db: Session = Depends(database.get_db)):
    vehicles = db.query(models.Vehicle).all()
    
    # Deduplicate by marca-modelo-anio
    seen = set()
    catalog = []
    
    for v in vehicles:
        key = (v.marca.lower(), v.modelo.lower(), v.anio)
        if key not in seen:
            seen.add(key)
            catalog.append(schemas.VehicleBase(
                placas="", # Placeholder
                marca=v.marca,
                modelo=v.modelo,
                anio=v.anio,
                km=0,
                imagen=v.imagen # Use the image from this vehicle instance
            ))
            
    return catalog

@router.get("/{vehicle_id}", response_model=schemas.Vehicle)
def read_vehicle(vehicle_id: int, db: Session = Depends(database.get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle
