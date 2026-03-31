import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

//const API_URL = 'http://172.16.71.199:8000';
//const API_URL = 'http://172.16.71.173:8000';
const API_URL = 'http://51.79.17.52:8000';

/**
 * API instance.
 * Points directly to the remote server on .52.
 */
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// localApi is now an alias for remote api to avoid breaking existing imports
export const localApi = api;

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('user_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ----------------------------------------------------------------------
// ENHANCED ERROR HANDLING INTERCEPTOR
// ----------------------------------------------------------------------
// This detects success: false in the body and extracts technical messages
// from the server (message, Mensaje, detail, error) globally.
const handleResponseSuccess = (response) => {
    const data = response.data;
    // Strictly validate: If success is false or if status is not 2xx, it's an error.
    if (data && data.success === false) {
        const errorMsg = data.message || data.Mensaje || data.error || data.detail || "Error en la operación del servidor.";
        console.error("[API Global Error] Logical Failure:", errorMsg);
        return Promise.reject(new Error(errorMsg));
    }
    return response;
};

const handleResponseError = (error) => {
    // Extract technical message from Axios error
    const data = error.response?.data;
    const errorMsg = data?.message || data?.Mensaje || data?.detail || error.message;
    console.error("[API Global Error] Network/Server Failure:", errorMsg);
    return Promise.reject(new Error(errorMsg));
};

api.interceptors.response.use(handleResponseSuccess, handleResponseError);
localApi.interceptors.response.use(handleResponseSuccess, handleResponseError);

export default api;
