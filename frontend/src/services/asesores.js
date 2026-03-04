import api from './api';

export const getAsesores = async () => {
    /**
     * Obtiene la lista de asesores desde el Backend.
     */
    try {
        console.log(`[Frontend] Fetching asesores directly on .199...`);
        const response = await api.get('/asesores/');
        return response.data;
    } catch (error) {
        console.error("Error fetching asesores:", error.message);
        throw error;
    }
};
