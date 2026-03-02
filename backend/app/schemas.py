from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# --- Modelos de Usuario ---

class UserBase(BaseModel):
    """
    Datos básicos del usuario compartidos en lectura y escritura.
    """
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    """
    Datos necesarios para crear un usuario (incluye password).
    """
    password: str
    role: str = "asesor"

class UserLogin(BaseModel):
    """
    Datos recibidos en el login.
    """
    usuario: str
    password: str

# --- Respuestas de Autenticación ---

class Sucursal(BaseModel):
    SucursalID: int
    SucursalNombre: str
    SucursalIP: str
    SucursalSerie: str

class UserDetail(BaseModel):
    """
    Modelo de detalle de usuario que se devuelve al frontend.
    """
    id: int
    nombre: str
    user: str
    apellido: Optional[str] = None
    email: Optional[str] = None
    sucursalid: Optional[str] = None
    ip: Optional[str] = None
    sucursal: Optional[str] = None
    sucursales: Optional[List[Sucursal]] = None

    class Config:
        orm_mode = True 
        extra = "allow" # Permitir campos adicionales de la API externa

class LoginResponse(BaseModel):
    """
    Respuesta al hacer login exitoso.
    """
    access_token: Optional[str] = None
    token: Optional[str] = None
    user: UserDetail

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Modelos de Vehículo ---

class VehicleBase(BaseModel):
    """
    Datos base del vehículo.
    """
    placas: str
    marca: str
    modelo: str
    color: Optional[str] = None
    no_serie: Optional[str] = None
    anio: Optional[int] = None
    km: Optional[int] = 0
    imagen: Optional[str] = None # URL

class VehicleCreate(VehicleBase):
    """
    Datos para registrar un vehículo.
    """
    cliente_id: int

class VehicleCreateNested(VehicleBase):
    pass

class Vehicle(VehicleBase):
    """
    Modelo de lectura de vehículo (incluye ID).
    """
    id: int
    cliente_id: int
    class Config:
        orm_mode = True

# --- Modelos de Cliente ---

class ClientBase(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    razon_social: Optional[str] = None
    rfc: Optional[str] = None
    regimen_fiscal: Optional[str] = None
    domicilio: Optional[str] = None
    cp: Optional[str] = None
    ciudad: Optional[str] = None
    estado: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    asesor: Optional[str] = None
    condiciones_pago: Optional[str] = None
    estado_catalogo: Optional[str] = "Activo"
    domicilio2: Optional[str] = None
    categoria: Optional[str] = None

class ClientCreate(ClientBase):
    vehiculo: Optional[VehicleCreateNested] = None

class Client(ClientBase):
    """
    Modelo de lectura de cliente completo, incluyendo sus vehículos.
    """
    id: int
    vehicles: List[Vehicle] = []

    class Config:
        orm_mode = True

# --- Modelos de Orden de Servicio ---

class OrderDetailBase(BaseModel):
    origen: str = "S"
    clave: str
    nombre: str
    cantidad: float
    precio_venta: float
    descuento: Optional[float] = 0.0

class OrderDetailCreate(OrderDetailBase):
    pass

class OrderDetail(OrderDetailBase):
    id: int
    importe: float
    subtotal: float
    orden_id: int
    class Config:
        orm_mode = True

class ServiceOrderBase(BaseModel):
    serie: str
    no_orden: int
    tipo_orden: str
    fecha: date
    unidad_negocio: str
    asesor_id: int
    servicio_foraneo: Optional[str] = None
    fecha_ingreso: datetime
    fecha_entrega: datetime
    cliente_id: int
    vehiculo_id: int
    observaciones: Optional[str] = None
    tasa_iva: float = 0.16

class ServiceOrderCreate(ServiceOrderBase):
    detalles: List[OrderDetailCreate] = []

class ServiceOrder(ServiceOrderBase):
    """
    Modelo de orden de servicio (lectura ligera).
    """
    id: int
    estatus: str
    detalles: List[OrderDetail] = []
    class Config:
        orm_mode = True

class ServiceOrderFull(ServiceOrder):
    """
    Modelo de orden completa con objetos anidados de Cliente y Vehículo.
    """
    cliente: Optional[Client] = None
    vehiculo: Optional[Vehicle] = None

