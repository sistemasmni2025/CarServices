import api from './api';

export const createVehicle = async (vehicleData) => {
    // Sync directly with .199
    const response = await api.post('/vehiculos/crear', vehicleData);
    return response.data;
};

export const getVehiclesByClient = async (clientId) => {
    const response = await api.get(`/vehiculos/cliente/${clientId}`);
    return response.data;
};

export const getUniqueCatalog = async () => {
    const response = await api.get('/vehiculos/catalogo/unico');
    return response.data;
};

export const searchVehiclesSoap = async (clientId) => {
    /**
     * Busca vehículos directamente en el backend .199
     */
    try {
        const response = await api.get(`/vehiculos/buscar/${clientId}`);
        return response.data;
    } catch (error) {
        console.warn("Vehicles Search Failed on .199", error);
        return [];
    }
};

export const registerVehicleSoap = async (vehicleData) => {
    const response = await api.post('/vehiculos/registrar', vehicleData);
    return response.data;
};
