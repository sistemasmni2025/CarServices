import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        /**
         * Maneja el evento de inicio de sesión.
         * Valida campos, llama al contexto de autenticación y maneja errores.
         * Muestra alertas nativas en caso de fallo.
         */
        const trimmedUsername = username.trim();
        if (!trimmedUsername || !password) {
            Alert.alert('Error', 'Por favor ingrese usuario y contraseña');
            return;
        }
        setLoading(true);
        try {
            await login(trimmedUsername, password);
        } catch (error) {
            console.error(error);
            let errorMessage = 'Usuario o contraseña incorrectos';

            if (error.message && error.message.includes('Sucursal')) {
                errorMessage = error.message;
            } else if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                // FastAPI error details are often arrays (422)
                // In this case, it's likely wrong credentials in the legacy system
                errorMessage = typeof detail === 'string'
                    ? detail
                    : 'Usuario o contraseña incorrectos (Error de Esquema)';
            }

            Alert.alert('Login Fallido', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.card}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/logo_nieto.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>


                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Usuario</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre de usuario"
                            placeholderTextColor="#999"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, (!username || !password) && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading || !username || !password}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>LOGIN</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.footerText}>Multillantas Nieto © 2026</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5', // Soft gray background
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 40,
        // Premium shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 180,
        height: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#444',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#F8F9FA',
        color: '#1A1A1A',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#007BFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#A0C4FF',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 1,
    },
    footerText: {
        marginTop: 32,
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    }
});

export default LoginScreen;
