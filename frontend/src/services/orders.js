import { Platform } from 'react-native';
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

        console.log(`[Frontend] Fetching/Creating Order ID directly on .173...`, payload);
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
    // Persist directly on .173
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
export const getOrdersList = async (ordenId = null, sucursalId = null, ordenEstatus = 'A') => {
    try {
        const payload = {};
        if (ordenId) payload.OrdenID = ordenId;
        if (sucursalId) payload.SucursalID = parseInt(sucursalId); // El backend prefiere int
        payload.OrdenEstatus = ordenEstatus;

        console.log(`[Frontend] Fetching Orders List directly on .199... payload:`, payload);
        const response = await api.post('/orden/listar', payload);
        return response.data;
    } catch (error) {
        console.error("Error fetching orders list:", error.message);
        throw error;
    }
};

export const cancelOrder = async (orderId) => {
    console.log(`[Frontend] Cancelling Order ${orderId} on .173...`);
    const response = await api.post('/orden/cancelar', { OrdenID: orderId });
    console.log(`[Frontend] Cancel Response:`, response.data);
    return response.data;
};

export const saveOrderTotal = async (payload, fotosDict = {}) => {
    /**
     * Guarda la orden completa usando el nuevo endpoint consolidado /ingresos/nuevo.
     * Envía la data estructurada (JSON), la metadata de las fotos (JSON) y las fotos físicas en un multipart/form-data.
     */
    console.log(`[Frontend] Saving Consolidated Order via multipart to .173 /ingresos/nuevo...`);

    try {
        const formData = new FormData();

        // 1. Agregar 'data': El megaPayload en formato JSON
        formData.append('data', JSON.stringify(payload));

        // Diccionario de IDs de evidencia actualizado (basado en tabla Genexus: EXTFRON=1, INTTABL=5, INTPUER=7, etc.)
        const photoLabels = {
            frontal: 1, lateralIzquierdo: 2, lateralDerecho: 3, trasero: 4,
            interior1: 5, interior2: 6, interior3: 7, interior4: 8,
            adicional: 9, firmaPrestador: 100, firmaCliente: 101
        };

        const metadata = [];

        // 2. Procesar e inyectar las fotografías
        for (const [key, uri] of Object.entries(fotosDict)) {
            if (uri && (uri.startsWith('file:') || uri.startsWith('blob:') || uri.startsWith('data:'))) {
                // Generar nombre simulado o extraer de uri
                let ext = uri.includes('data:image/png') || uri.endsWith('.png') ? 'png' : 'jpg';
                if (key === 'firmaPrestador' || key === 'firmaCliente') ext = 'bmp';

                const filename = `${key}_${Date.now()}.${ext}`;
                const tipoEvidenciaID = photoLabels[key] || 99;

                // Anexar la metadata respectiva
                metadata.push({
                    filename: filename,
                    TipoEvidenciaID: tipoEvidenciaID
                });

                // Anexar el archivo físico
                if (Platform.OS === 'web') {
                    const fetchResponse = await fetch(uri);
                    const blob = await fetchResponse.blob();
                    formData.append('fotos', blob, filename);
                } else {
                    formData.append('fotos', {
                        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                        name: filename,
                        type: `image/${ext}`,
                    });
                }
            }
        }

        // 3. Agregar 'metadata': El arreglo de referencias
        formData.append('metadata', JSON.stringify(metadata));

        // 4. Enviar mediante cliente axios 'api'
        // El cliente api usualmente usaba JSON por defecto. Tenemos que forzar el Content-Type multipart
        const response = await api.post('/ingresos/nuevo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                // Omitir Accept si axios ya lo maneja, pero por si acaso
                'Accept': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error("Error Saving Order Multipart:", error.response?.data || error.message);
        throw error;
    }
};
