import api, { localApi } from './api';

export const getClients = async () => {
    // Local DB has the SOAP-synced clients
    const response = await localApi.get('/clients/');
    return response.data;
};

export const createClient = async (clientData) => {
    // Create in Local (Triggers SOAP + REST Push)
    const response = await localApi.post('/clients/', clientData);
    return response.data;
};

export const getClientById = async (id) => {
    const response = await localApi.get(`/clients/${id}`);
    return response.data;
};

export const searchClients = async (query) => {
    // Search via Local Proxy (SOAP)
    /**
     * Busca clientes mediante el Proxy Local (conecta a SOAP).
     */
    const response = await localApi.get(`/clients/search`, { params: { q: query } });
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
