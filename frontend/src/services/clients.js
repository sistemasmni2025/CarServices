import api, { localApi } from './api';

export const getClients = async () => {
    const response = await api.get('/clientes/listar');
    return response.data;
};

export const createClient = async (clientData) => {
    const response = await api.post('/clientes/crear', clientData);
    return response.data;
};

export const getClientById = async (id) => {
    const response = await api.get(`/clientes/consultar/${id}`);
    return response.data;
};

export const searchClients = async (query, dns) => {
    // console.log(`[clients.js] native fetch starting for: ${query} on dns: ${dns}`);
    try {
        const response = await fetch(`http://51.79.17.52:8000/soap/clientes?ip=${dns || ''}&criterio=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        // console.log(`[clients.js] fetch returned status: ${response.status}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // console.log(`[clients.js] fetch parsed data length/type:`, Array.isArray(data) ? data.length : typeof data);
        return data;
    } catch (error) {
        // console.error(`[clients.js] fetch failed (returning empty array to prevent crash):`, error);
        return []; // Return empty array instead of throwing error to prevent app crashes on timeouts
    }
};

// Backend Proxy for Client Sync
export const syncClient = async (clientData) => {
    /**
     * Sincroniza el cliente seleccionado/creado con la base de datos MySQL local
     * para que pueda ser referenciado en la creación de vehículos posteriores.
     */
    try {
        const idGeneradoLocal = `C${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

        // El id Genexus es típicamente el campo 'id' principal si viene de SOAP, 
        // o 'clienteidgen' si ya lo habíamos guardado. Aseguramos fallback.
        const idgenexus = clientData.clienteidgen || clientData.id || 0;

        const payload = {
            ClienteClave: String(idgenexus !== 0 ? idgenexus : idGeneradoLocal),
            ClienteNombre: clientData.nombre ? clientData.nombre.trim() : "SIN NOMBRE",
            ClienteRazon: clientData.razon_social ? clientData.razon_social.trim() : (clientData.nombre ? clientData.nombre.trim() : "SIN NOMBRE"),
            ClienteRegimen: clientData.regimen_fiscal || "616 - Sin obligaciones fiscales",
            ClienteRFC: (clientData.rfc || "XAXX010101000").trim().toUpperCase().substring(0, 13),
            ClienteDomicilio: clientData.domicilio ? clientData.domicilio.trim() : "Conocido",
            ClienteDomicilio2: clientData.domicilio2 ? clientData.domicilio2.trim() : "",
            ClienteCiudad: clientData.ciudad ? clientData.ciudad.trim() : "Celaya",
            ClienteEstadoClave: clientData.estado ? clientData.estado.substring(0, 3).toUpperCase() : "GTO",
            ClienteEstadoNombre: clientData.estado || "Guanajuato",
            ClienteCP: clientData.cp ? clientData.cp.trim() : "38000",
            ClienteCategoria: "1",
            ClienteDiasCredito: 30,
            // Agregamos el parámetro crítico solicitado
            ClienteIDGen: String(idgenexus)
        };

        // console.log("[Sync] Syncing client to MySQL (/clientes/crear):", payload);
        const response = await api.post('/clientes/crear', payload);
        // console.log("[Sync] Success:", response.data);

        return {
            success: true,
            clienteidgen: response.data?.ClienteIDGen || idgenexus,
            localId: response.data?.ClienteID
        };
    } catch (error) {
        // console.error("Client sync failed:", error);
        if (error.response) {
            // console.error("Sync error details:", error.response.data);
        }
        throw error;
    }
};
