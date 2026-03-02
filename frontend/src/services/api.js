import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = 'http://172.16.71.199:8000';

/**
 * API instance.
 * Points directly to the remote server on .199.
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

localApi.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('user_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
