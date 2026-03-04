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
        const response = await api.get(`/vehiculos/soap/${clientId}`);
        // Handle wrapper if present
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            return response.data.data;
        } else if (Array.isArray(response.data)) {
            return response.data;
        }
        return [];
    } catch (error) {
        console.warn("Vehicles Search Failed on .199", error);
        return [];
    }
};

export const registerVehicleSoap = async (vehicleData) => {
    const response = await api.post('/vehiculos/registrar', vehicleData);
    return response.data;
};
