import api from './api';

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
    const response = await api.get(`/clientes/buscar`, { params: { q: query } });
    return response.data;
};

// Backend Proxy for Client Sync
export const syncClient = async (clientData) => {
    /**
     * Sincroniza un cliente local con el Backend remoto.
     * Mapea los campos locales a los esperados por el sistema legacy.
     */
    try {
        console.log("[Sync] Sending to Backend Proxy:", clientData);
        // We send the raw clientData to our Backend, 
        // The Backend will handle the mapping to "clientenombre", etc.
        const response = await localApi.post('/clients/sync', clientData);
        return response.data;
    } catch (error) {
        console.error("Client sync failed:", error);
        throw error;
    }
};
