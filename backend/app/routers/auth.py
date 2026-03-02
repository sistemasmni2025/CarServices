from fastapi import APIRouter, Depends, HTTPException, status
import requests
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import database, models, auth, schemas

router = APIRouter(tags=["Authentication"])

@router.post("/token", response_model=schemas.LoginResponse)
@router.post("/api/auth/login", response_model=schemas.LoginResponse)
def login_for_access_token(credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    """
    Endpoint para iniciar sesión.
    Funciona como un proxy: recibe las credenciales y las envía al servicio de autenticación externo.
    """
    
    # URL del servicio externo de autenticación
    external_auth_url = "http://172.16.71.199:8000/auth/login"
    
    # Preparamos el payload. El requisito es enviar el username como 'usuario'.
    # Ya no es necesario buscar el email localmente.
    payload = {
        "UsuarioClave": credentials.usuario,
        "UsuarioPassword": credentials.password
    }
    
    try:
        # Hacemos la petición POST al servicio externo
        response = requests.post(external_auth_url, json=payload, timeout=5)
    except requests.exceptions.RequestException as e:
         # Si el servicio externo está caído, lanzamos un error 503
         raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Servicio de autenticación externo no disponible: {str(e)}"
        )

    if response.status_code == 200:
        data = response.json()
        # La API externa devuelve { "token": "...", "user": { ... } }
        # Esto coincide con nuestro esquema LoginResponse, así que lo devolvemos directo.
        return data
    else:
        # Si el login falla remotamente, reenviamos el error.
        error_detail = "Usuario o contraseña incorrectos"
        try:
            error_json = response.json()
            # Buscamos claves comunes de error en la respuesta
            error_detail = error_json.get("detail") or error_json.get("message") or error_detail
        except:
            pass
            
        raise HTTPException(
            status_code=response.status_code, # Mantenemos el código de estado original (401, 403, etc.)
            detail=error_detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
