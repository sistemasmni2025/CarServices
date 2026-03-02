from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Cadena de conexión a la base de datos
# Actualmente usando SQLite para desarrollo local (se crea un archivo sql_app.db)
# Si quisieras usar MySQL, descomentarías la línea de abajo y pondrías tus credenciales
# mysql+mysqlconnector://user:password@host/db_name
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
# SQLALCHEMY_DATABASE_URL = "mysql+mysqlconnector://root:123456789@172.16.71.199/carservices"

# Crear el motor de la base de datos
# "check_same_thread": False es necesario solo para SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Fábrica de sesiones para interactuar con la BD
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base para nuestros modelos (tablas)
Base = declarative_base()

def get_db():
    """
    Dependencia para obtener una sesión de base de datos en los endpoints.
    Se asegura de cerrar la sesión cuando termina la petición.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
