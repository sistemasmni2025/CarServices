import api from './api';

// Backend Proxy for Order ID/Creation
export const getNextOrderId = async (sucursalId, usuarioId, asesorId) => {
    /**
     * Obtiene/Crea el ID de orden desde el Backend (Proxy a /orden/crear).
     */
    try {
        const payload = {
            SucursalID: sucursalId ? sucursalId.toString() : "1",
            UsuarioID: usuarioId ? usuarioId.toString() : "1",
            AsesorID: asesorId ? asesorId.toString() : "1"
        };

        console.log(`[Frontend] Fetching/Creating Order ID directly on .199...`, payload);
        // Call the remote backend directly
        const response = await api.post('/orden/crear', payload);
        const data = response.data;
        console.log(`[Frontend] Order ID Response:`, data);

        // Structure from user: { "OrdenID": 236, "OrdenExistente": false, "OrdenSerie": null, "OrdenDetalle": null }
        return {
            idorden: data.OrdenID?.toString() || '',
            serie: data.OrdenSerie?.toString() || '',
            existente: data.OrdenExistente,
            detalle: data.OrdenDetalle || null,
            ...data
        };

    } catch (error) {
        const detail = error.response?.data?.detail || error.message;
        console.error("Error fetching/creating Order:", detail);
        throw new Error(detail);
    }
};

export const createOrder = async (orderData) => {
    // Persist directly on .199
    const response = await api.post('/orden/crear', orderData);
    return response.data;
};

export const updateExternalOrder = async (payload) => {
    console.log(`[Frontend] Updating External Order on .199...`, payload);
    const response = await api.post('/orden/actualizar', payload);
    console.log(`[Frontend] External Update Response:`, response.data);
    return response.data;
};

export const getOrderById = async (id) => {
    const response = await api.get(`/orden/consultar/${id}`);
    return response.data;
};

export const getPendingOrder = async (sucursalId, usuarioId) => {
    try {
        const response = await api.get('/orden/pendiente', {
            params: {
                sucursal_id: sucursalId,
                usuario_id: usuarioId
            }
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null; // No pending order
        }
        throw error;
    }
};
export const getOrdersList = async (ordenId = null) => {
    try {
        const payload = ordenId ? { OrdenID: ordenId } : {};
        console.log(`[Frontend] Fetching Orders List directly on .199... payload:`, payload);
        const response = await api.post('/orden/listar', payload);
        return response.data;
    } catch (error) {
        console.error("Error fetching orders list:", error.message);
        throw error;
    }
};

export const cancelOrder = async (orderId) => {
    console.log(`[Frontend] Cancelling Order ${orderId} on .199...`);
    const response = await api.post('/orden/cancelar', { OrdenID: orderId });
    console.log(`[Frontend] Cancel Response:`, response.data);
    return response.data;
};

export const saveOrderTotal = async (payload) => {
    /**
     * Guarda la orden completa usando el payload consolidado.
     * Originalmente apuntaba a /api/orden/guardar_total, pero
     * ahora apunta al nuevo broker en /api/orden/finalizar_proceso
     * que realiza los dos pasos requeridos.
     */
    console.log(`[Frontend] Saving Consolidated Order directly on .199...`);
    // Point directly to the native external endpoint
    const response = await api.post('/orden/guardar_total', payload);
    return response.data;
};
