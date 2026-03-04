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

export const searchClients = async (query) => {
    console.log(`[clients.js] native fetch starting for: ${query}`);
    try {
        const response = await fetch(`http://172.16.71.199:8000/clientes/soap/clientes?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log(`[clients.js] fetch returned status: ${response.status}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[clients.js] fetch parsed data length/type:`, Array.isArray(data) ? data.length : typeof data);
        return data;
    } catch (error) {
        console.error(`[clients.js] fetch failed:`, error);
        throw error;
    }
};

// Backend Proxy for Client Sync
export const syncClient = async (clientData) => {
    /**
     * BYPASS: Sincroniza un cliente local con el Backend remoto.
     * Obsoleto: El Mega-Payload en el Paso 5 ya envía todos los datos.
     */
    try {
        console.log("[Sync] Bypassing Obsolete Backend Proxy (/clients/sync). Returning success immediately.", clientData);
        // We bypass the external call since the endpoint is 404 and the Mega-Payload handles it
        return { success: true, clienteidgen: clientData.clienteidgen || clientData.id || 0 };
    } catch (error) {
        console.error("Client sync failed:", error);
        throw error;
    }
};
