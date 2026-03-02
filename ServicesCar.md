# ServicesCar - Sistema Integral de Gestión Automotriz

Este documento detalla la estructura, flujo y componentes del sistema **ServicesCar** desarrollado para **Multillantas Nieto**. El sistema está diseñado para optimizar el ingreso de vehículos a taller, la gestión de clientes y el levantamiento de órdenes de servicio.

---

## 1. Arquitectura del Sistema

El sistema se divide en dos capas principales:

*   **Frontend**: Aplicación móvil/web desarrollada con **React Native (Expo)**.
*   **Backend**: API REST desarrollada con **Python (FastAPI)** y base de datos relacional.

---

## 2. Flujo de Navegación (Business Logic)

El sistema sigue un flujo lógico secuencial para garantizar la integridad de los datos:

### Punto 1: Autenticación (Login)
*   **Acceso Seguro**: Pantalla de inicio con validación de credenciales (Usuario/Contraseña).
*   **Persistencia**: Uso de JWT (JSON Web Tokens) para mantener la sesión activa.
*   **Identidad**: El sistema reconoce al asesor logueado para asignar las órdenes correspondientes.

### Punto 2: Panel de Control (Dashboard)
Una vez autenticado, el usuario accede a un menú ejecutivo con dos vertientes principales:
1.  **Consultar Cotizaciones**: Módulo con buscador (lupa) para rastrear órdenes de servicio previas.
2.  **Realizar Cotización**: Acceso directo al asistente de registro vehicular.

### Punto 3: Asistente de Registro (Wizard)
Un proceso guiado de 5 pasos diseñado para la captura rápida en campo:

1.  **Ingreso**: Captura de folio (Serie, No. Orden) y selección de fechas.
2.  **Cliente**: Buscador inteligente por nombre o placas, con opción de "Alta Rápida" para nuevos clientes.
3.  **Vehículo**: Catálogo visual de marcas, modelos y años. Captura técnica (KM, No. Serie, Color, Nivel de Combustible).
4.  **Fotografías (Evidencia)**: Interfaz seccionada para capturar 12 ángulos críticos del vehículo (Frente, Trasera, Motor, Interiores, etc.).
5.  **Resumen**: Vista previa de toda la información capturada antes de la generación final.

---

## 3. Características Técnicas Destacadas

### Diseño Visual (Aesthetics)
*   **Diseño "Pill"**: Uso consistente de bordes redondeados y tipografía moderna para un acabado premium.
*   **Modo Ejecutivo**: Interfaz limpia, sin saturación visual, optimizada para tablets y dispositivos móviles.
*   **Interactividad**: Selectores dinámicos y retroalimentación táctil en cada paso.

### Gestión de Datos
*   **Persistencia de Estado**: El sistema guarda el progreso del registro. Si el asesor navega atrás, no pierde la información ya capturada.
*   **Validación en Tiempo Real**: Los botones de navegación se habilitan solo cuando los campos obligatorios están completos.
*   **Web Services**: Comunicación asíncrona mediante Axios con interceptores para seguridad.

---

## 4. Estructura de Endpoints (Próxima Fase)

Para la integración final de los servicios web, se han definido los siguientes puntos de conexión:

| Endpoint | Método | Descripción |
| :--- | :--- | :--- |
| `/token` | POST | Validación de usuario y generación de token. |
| `/clients/search` | GET | Búsqueda dinámica de clientes existentes. |
| `/vehicles/catalog` | GET | Recuperación de marcas, modelos y años. |
| `/orders/create` | POST | Envío de la orden final incluyendo datos y evidencias. |

---

## 5. Contacto y Soporte
Desarrollado para la operación eficiente de **Multillantas Nieto**.
*   **Versión**: 1.2.5
*   **Estado**: Desarrollo de Interfaz y Lógica de Navegación (Completado).
*   **Siguiente Paso**: Configuración de WebServices de Producción.

---
© 2026 Multillantas Nieto | Sistema ServicesCar
