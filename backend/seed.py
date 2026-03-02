from app import models, database, auth
from sqlalchemy.orm import Session

# Create tables
models.Base.metadata.create_all(bind=database.engine)

db = database.SessionLocal()

# Check if admin exists
user = db.query(models.User).filter(models.User.username == "admin").first()
if not user:
    print("Creating admin user...")
    hashed_password = auth.get_password_hash("admin")
    new_user = models.User(username="admin", email="admin@nieto.com", hashed_password=hashed_password, role="admin")
    db.add(new_user)
    db.commit()
    print("Admin user created: admin / admin")
else:
    print("Admin user already exists")

# Check if clients exist
if db.query(models.Client).count() == 0:
    print("Creating 25 dummy clients...")
    # Generate 25 dummy clients
    base_clients = [
        ("Transportes del Norte", "TNO901010ABC"), ("Logística Express", "LEX050505XYZ"), 
        ("Juan Perez", "PEPJ800101H10"), ("Autobuses Azules", "AAZ101010123"),
        ("Constructora Rocha", "CRO990909567"), ("Fletes México", "FME101010R44"),
        ("Distribuidora Alimentos", "DAL880202UI9"), ("Servicios Industriales", "SIN020202OP0"),
        ("Mecánica Diesel", "MDI110303PL2"), ("Transportes Garcia", "TGA770707JK8"),
        ("Comercializadora Nuevo León", "CNL990101HH2"), ("Grupo Serna", "GSE050505RR3"),
        ("Operadora Logística", "OLO080808WQ1"), ("Materiales para Construcción", "MPC121212TT5"),
        ("Autotransportes El Rápido", "AER010101UU7"), ("Proveedora de Llantas", "PLL030303II8"),
        ("Taller Mecánico El Tuercas", "TME040404OO9"), ("Flotillas del Noreste", "FNO060606PP0"),
        ("Logística y Distribución", "LDI070707AA1"), ("Servicios de Carga", "SCA090909SS2"),
        ("Transportes Especializados", "TES111111DD3"), ("Grupo Industrial Alpha", "GIA131313FF4"),
        ("Constructora Beta", "CBE141414GG5"), ("Comercializadora Gamma", "CGA151515HH6"),
        ("Servicios Delta", "SDE161616JJ7")
    ]
    
    for i, (name, rfc) in enumerate(base_clients):
        client = models.Client(
            codigo=f"C{str(i+1).zfill(3)}",
            nombre=name.upper(),
            razon_social=name.upper() + " S.A. DE C.V.",
            rfc=rfc,
            regimen_fiscal="601 - General de Ley Personas Morales",
            domicilio=f"Calle Industrial {i*10}",
            cp="64000",
            ciudad="Monterrey",
            estado="Nuevo León",
            telefono=f"818{str(i).zfill(7)}",
            email=f"contacto{i}@empresa.com",
            condiciones_pago="Crédito 30 días"
        )
        db.add(client)
    db.commit()
    print("25 Dummy clients created successfully")
else:
    print("Clients already exist (Count > 0)")
