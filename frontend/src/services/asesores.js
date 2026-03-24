import api from './api';

export const getAsesores = async (dns) => {
    /**
     * Obtiene la lista de asesores desde el Backend.
     */
    try {
        // console.log(`[Frontend] Fetching asesores directly on .52...`);
        const response = await api.get(`/soap/asesores?ip=${dns || ''}`);
        return response.data;
    } catch (error) {
        // console.error("Error fetching asesores:", error.message);
        throw error;
    }
};
