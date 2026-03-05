import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (username, password) => {
    /**
     * Servicio de Login.
     * Envía credenciales al backend y guarda el token recibido.
     */
    const payload = {
        UsuarioClave: username,
        UsuarioPassword: password
    };

    // Direct call to remote backend .173
    const response = await api.post('/auth/login', payload);

    if (response.data.access_token) {
        await AsyncStorage.setItem('user_token', response.data.access_token);
    }
    return response.data;
};

export const logout = async () => {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('WIZARD_STATE');
};
