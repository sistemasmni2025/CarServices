import api, { localApi } from './api';

export const getClients = async () => {
    const response = await api.get('/clientes/listar');
    return response.data;
};

export const createClient = async (clientData) => {
    const response = await api.post('/clientes/nuevo', clientData);
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

// Helper to map UI client data to Backend Schema
const mapClientToBackend = (clientData, dns = "") => {
    // Determine GeneXus ID - Ensure it's numeric for ClienteIDGen if possible
    const rawIdGen = clientData.clienteidgen || clientData.id || 0;
    // Remove 'C' prefix for the Genexus numeric field
    const cleanIdGen = String(rawIdGen).replace(/^C/, '');
    
    const idGeneradoLocal = `C${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

    const payload = {
        DNS: dns || "",
        ClienteID: clientData.localId || 0, // MySQL Internal ID
        ClienteId: clientData.localId || 0, // Fallback for case sensitivity
        ClienteClave: String(rawIdGen !== 0 ? rawIdGen : idGeneradoLocal),
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
        ClienteTelefono: clientData.telefono ? clientData.telefono.trim() : "",
        ClienteEmail: clientData.email ? clientData.email.trim() : "",
        ClienteIDGen: cleanIdGen !== '0' ? cleanIdGen : "0"
    };

    console.log("[Client API Map] Payload generated:", JSON.stringify(payload, null, 2));
    return payload;
};

// Backend Proxy for Client Sync (Create if not exists)
export const syncClient = async (clientData, dns = "") => {
    const payload = mapClientToBackend(clientData, dns);
    const response = await api.post('/clientes/crear', payload);

    return {
        success: true,
        clienteidgen: response.data?.ClienteIDGen || payload.ClienteIDGen,
        localId: response.data?.ClienteID
    };
};

// Dedicated Update Endpoint
export const updateClient = async (clientData, dns = "") => {
    const payload = mapClientToBackend(clientData, dns);
    const response = await api.post('/clientes/actualizar', payload);

    return {
        success: true,
        clienteidgen: response.data?.ClienteIDGen || payload.ClienteIDGen,
        localId: response.data?.ClienteID || clientData.localId
    };
};
