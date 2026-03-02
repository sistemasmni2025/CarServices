from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    """
    Modelo de Usuario (Asesor).
    Representa la tabla 'usuario' en la base de datos.
    """
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True) # Nombre de usuario único
    nombre = Column(String(50), default="Usuario") 
    apellido = Column(String(50), default="Sistema")
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255), name="password_hash") # Contraseña encriptada
    is_active = Column(Boolean, default=True, name="activo") # Si el usuario puede entrar
    role = Column(String(20), default="asesor") # Rol (ej. admin, asesor)
    
    sucursal_id = Column(Integer, nullable=True)
    fecha_registro = Column(DateTime, nullable=True)

class Client(Base):
    """
    Modelo de Cliente.
    Representa la tabla 'clients'.
    """
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, index=True) # Código único del cliente
    nombre = Column(String(100))
    razon_social = Column(String(100))
    rfc = Column(String(20))
    regimen_fiscal = Column(String(100))
    domicilio = Column(String(200))
    cp = Column(String(10))
    ciudad = Column(String(50))
    estado = Column(String(50))
    telefono = Column(String(20))
    email = Column(String(100))
    asesor = Column(String(50)) 
    condiciones_pago = Column(String(50)) # Ej: Contado, Crédito
    estado_catalogo = Column(String(50), default="Activo")
    domicilio2 = Column(String(200), nullable=True) # Datos extra requeridos por SOAP
    categoria = Column(String(50), nullable=True)

class Vehicle(Base):
    """
    Modelo de Vehículo.
    Representa la tabla 'vehicles'.
    """
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    placas = Column(String(20), unique=True, index=True)
    marca = Column(String(50))
    modelo = Column(String(50))
    color = Column(String(50))
    no_serie = Column(String(50))
    anio = Column(Integer)
    km = Column(Integer)
    imagen = Column(String(500), nullable=True) # URL de la foto del vehículo (si tiene)
    cliente_id = Column(Integer, ForeignKey("clients.id")) # Relación con Cliente

    # Relación inversa para acceder al cliente desde el vehículo
    cliente = relationship("Client", backref="vehicles")

class ServiceOrder(Base):
    """
    Modelo de Orden de Servicio.
    Representa la tabla 'service_orders'. Contiene la información general de la orden.
    """
    __tablename__ = "service_orders"

    id = Column(Integer, primary_key=True, index=True)
    serie = Column(String(10))
    no_orden = Column(Integer, unique=True, index=True) 
    tipo_orden = Column(String(50)) # Ej: Venta, Garantia
    fecha = Column(Date)
    unidad_negocio = Column(String(100))
    asesor_id = Column(Integer, ForeignKey("usuario.id"))
    servicio_foraneo = Column(String(100))
    fecha_ingreso = Column(DateTime)
    fecha_entrega = Column(DateTime)
    
    cliente_id = Column(Integer, ForeignKey("clients.id"))
    vehiculo_id = Column(Integer, ForeignKey("vehicles.id"))
    
    observaciones = Column(String(500))
    tasa_iva = Column(Float, default=0.16)
    estatus = Column(String(20), default="Abierta") # Abierta, Cerrada, Cancelada

    # Relaciones con otras tablas
    cliente = relationship("Client")
    vehiculo = relationship("Vehicle")
    asesor = relationship("User")
    detalles = relationship("OrderDetail", back_populates="orden") # Una orden tiene muchos detalles

class OrderDetail(Base):
    """
    Modelo de Detalle de Orden.
    Representa cada ítem (servicio o producto) dentro de una orden.
    """
    __tablename__ = "order_details"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("service_orders.id"))
    origen = Column(String(1), default="S") # S=Servicio, A=Almacen, C=Concepto
    clave = Column(String(50)) # Clave del producto/servicio
    nombre = Column(String(200)) # Descripción
    cantidad = Column(Float)
    precio_venta = Column(Float)
    importe = Column(Float) # cantidad * precio
    descuento = Column(Float, default=0.0)
    subtotal = Column(Float) # importe - descuento

    orden = relationship("ServiceOrder", back_populates="detalles")

