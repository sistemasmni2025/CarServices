import api, { localApi } from './api';

// Backend Proxy for Order ID/Creation
export const getNextOrderId = async (sucursalId, usuarioId, asesorId) => {
    /**
     * Obtiene/Crea el ID de orden desde el Backend (Proxy a /orden/crear).
     */
    try {
        const params = {
            sucursal_id: sucursalId ? sucursalId.toString() : "1",
            usuario_id: usuarioId ? usuarioId.toString() : "1",
            asesor_id: asesorId ? asesorId.toString() : "1"
        };

        console.log(`[Frontend] Fetching/Creating Order ID...`, params);
        // Call our local backend proxy which handles the 119:8000/orden/crear
        const response = await localApi.get('/orders/next-id', { params });
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
    // Persist in local DB
    const response = await localApi.post('/orders/', orderData);
    return response.data;
};

export const updateExternalOrder = async (payload) => {
    console.log(`[Frontend] Updating External Order...`, payload);
    const response = await localApi.post('/orders/actualizar', payload);
    console.log(`[Frontend] External Update Response:`, response.data);
    return response.data;
};

export const getOrderById = async (id) => {
    const response = await localApi.get(`/orders/${id}`);
    return response.data;
};

export const getPendingOrder = async (sucursalId, usuarioId) => {
    try {
        const response = await localApi.get('/orders/pending', {
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
        console.log(`[Frontend] Fetching Orders List via proxy... payload:`, payload);
        // We use POST because the backend proxy is @router.post("/listar")
        // payload as body
        const response = await localApi.post('/orders/listar', payload);
        return response.data;
    } catch (error) {
        console.error("Error fetching orders list:", error.message);
        throw error;
    }
};

export const cancelOrder = async (orderId) => {
    console.log(`[Frontend] Cancelling Order ${orderId}...`);
    const response = await localApi.put(`/orders/${orderId}/cancel`);
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
    console.log(`[Frontend] Saving Consolidated Order via Proxy Dual...`);
    // Usamos api para llegar al proxy /api/orden/finalizar_proceso en main.py
    const response = await api.post('/api/orden/finalizar_proceso', payload);
    return response.data;
};
