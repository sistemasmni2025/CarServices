from app.database import engine, Base
from app import models
from sqlalchemy import text

def run_migration():
    print("Iniciando migración a MySQL...")
    
    with engine.connect() as connection:
        # 1. Alter 'usuario' table to add missing columns
        try:
            print("Verificando tabla 'usuario'...")
            # Check if columns exist (simple try/catch or assume we need to add them if not transparent)
            # Using 'ADD COLUMN IF NOT EXISTS' is MariaDB 10.2+, MySQL 8.0 support depends on version but usually safe to try catch.
            # Standard MySQL syntax usually doesn't support IF NOT EXISTS in ADD COLUMN directly in older versions without query.
            # But let's assume MySQL 8.0 as user said.
            
            # Adding username
            try:
                connection.execute(text("ALTER TABLE usuario ADD COLUMN username VARCHAR(50) UNIQUE"))
                print("Columna 'username' agregada.")
            except Exception as e:
                print(f"Columna 'username' probablemente ya existe o error: {e}")

            # Adding role
            try:
                connection.execute(text("ALTER TABLE usuario ADD COLUMN role VARCHAR(20) DEFAULT 'asesor'"))
                print("Columna 'role' agregada.")
            except Exception as e:
                print(f"Columna 'role' probablemente ya existe o error: {e}")
                
        except Exception as e:
            print(f"Error alterando tabla usuario: {e}")

    # 2. Create other tables
    print("Creando tablas faltantes (clients, vehicles, orders)...")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Tablas creadas correctamente.")
    except Exception as e:
        print(f"Error creando tablas: {e}")

if __name__ == "__main__":
    run_migration()
