import api, { localApi } from './api';

export const createVehicle = async (vehicleData) => {
    // Local DB + Sync
    const response = await localApi.post('/vehicles/', vehicleData);
    return response.data;
};

export const getVehiclesByClient = async (clientId) => {
    // Local DB
    const response = await localApi.get(`/vehicles/client/${clientId}`);
    return response.data;
};

export const getUniqueCatalog = async () => {
    // Local DB
    const response = await localApi.get('/vehicles/catalog/unique');
    return response.data;
};

export const searchVehiclesSoap = async (clientId) => {
    // SOAP Proxy via Local Backend
    /**
     * Busca vehículos en el sistema legacy (SOAP) vía Proxy Local.
     */
    try {
        const response = await localApi.get(`/vehicles/soap/search/${clientId}`);
        return response.data;
    } catch (error) {
        console.warn("SOAP Search Failed", error);
        return [];
    }
};

export const registerVehicleSoap = async (vehicleData) => {
    // SOAP Register via Local Backend
    /**
     * Registra un nuevo vehículo en el sistema legacy (SOAP).
     */
    const response = await localApi.post('/vehicles/soap/register', vehicleData);
    return response.data;
};
