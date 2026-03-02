import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginService } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userName, setUserName] = useState(null);
    const [userData, setUserData] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);

    const login = async (username, password) => {
        /**
         * Función de inicio de sesión.
         * 1. Llama al servicio de login.
         * 2. Valida que el usuario tenga sucursales asignadas.
         * 3. Guarda el token y datos del usuario en AsyncStorage.
         */
        setIsLoading(true);
        try {
            const response = await loginService(username, password);
            const token = response.token || response.access_token;
            const user = response.user;

            if (!user.sucursales || user.sucursales.length === 0) {
                // Seguridad: Si no tiene sucursal, no puede operar.
                throw new Error("Contacta a Soporte , No tienes permisos (Sucursal)");
            }

            // Normalización de sucursales: Asegurar que tengan id y nombre (minúsculas)
            // para compatibilidad con el resto de la app.
            user.sucursales = user.sucursales.map(s => ({
                ...s,
                id: s.id || s.SucursalID,
                nombre: s.nombre || s.SucursalNombre
            }));

            setUserToken(token);

            // Nombre para mostrar en UI
            const displayName = user ? `${user.nombre} ${user.apellido}` : username.toUpperCase();
            setUserName(displayName);
            setUserData(user);

            // Persistencia de sesión
            await AsyncStorage.setItem('user_token', token);
            await AsyncStorage.setItem('user_name', displayName);
            await AsyncStorage.setItem('login_timestamp', Date.now().toString());

            if (user) {
                await AsyncStorage.setItem('user_data', JSON.stringify(user));
            }
        } catch (e) {
            console.log(e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        /**
         * Cierra la sesión activa.
         * Elimina token y datos de usuario de AsyncStorage.
         * NOTA: No eliminamos WEBSESSION_ORDEN para mantener la persistencia
         * de la orden en curso caso de cierre accidental de la app, según requerimiento.
         */
        setIsLoading(true);
        setUserToken(null);
        setUserName(null);
        setUserData(null);
        setSelectedBranch(null);
        await AsyncStorage.removeItem('user_token');
        await AsyncStorage.removeItem('user_name');
        await AsyncStorage.removeItem('user_data');
        await AsyncStorage.removeItem('selected_branch');
        await AsyncStorage.removeItem('login_timestamp');

        // await AsyncStorage.removeItem('WEBSESSION_ORDEN'); // Se mantiene comentado intencionalmente
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        console.log("[AuthContext] Checking if logged in...");
        try {
            console.log("[AuthContext] Fetching token...");
            let token = await AsyncStorage.getItem('user_token');
            console.log("[AuthContext] Fetching name...");
            let name = await AsyncStorage.getItem('user_name');
            console.log("[AuthContext] Fetching data...");
            let data = await AsyncStorage.getItem('user_data');
            console.log("[AuthContext] Fetching branch...");
            let branch = await AsyncStorage.getItem('selected_branch');
            console.log("[AuthContext] Fetching timestamp...");
            let timestamp = await AsyncStorage.getItem('login_timestamp');

            // Validación de caducidad de sesión (23 horas)
            const now = Date.now();
            const twentyThreeHoursMs = 23 * 60 * 60 * 1000;

            if (timestamp && (now - parseInt(timestamp) > twentyThreeHoursMs)) {
                console.log("Sesión web expirada (> 23h). Cerrando sesión.");
                await logout();
                return;
            }

            setUserToken(token);
            setUserName(name);
            if (data) {
                const parsedUser = JSON.parse(data);
                if (parsedUser.sucursales) {
                    parsedUser.sucursales = parsedUser.sucursales.map(s => ({
                        ...s,
                        id: s.id || s.SucursalID,
                        nombre: s.nombre || s.SucursalNombre
                    }));
                }
                setUserData(parsedUser);
            }
            if (branch) {
                const parsedBranch = JSON.parse(branch);
                const normalizedBranch = {
                    ...parsedBranch,
                    id: parsedBranch.id || parsedBranch.SucursalID,
                    nombre: parsedBranch.nombre || parsedBranch.SucursalNombre
                };
                setSelectedBranch(normalizedBranch);
            }
            console.log("[AuthContext] Done. isLoading -> false");
        } catch (e) {
            console.log("[AuthContext] Restoring session failed:", e);
        } finally {
            setIsLoading(false);
            console.log("[AuthContext] isLoading set to false (finally)");
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) {
                console.log("[AuthContext] Safety timeout reached, forcing isLoading to false");
                setIsLoading(false);
            }
        }, 5000);

        isLoggedIn().then(() => clearTimeout(timeout));

        return () => clearTimeout(timeout);
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, userName, userData, selectedBranch, setSelectedBranch }}>
            {children}
        </AuthContext.Provider>
    );
};

