import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Image, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getPendingOrder } from '../services/orders';
// logo import removed for require consistency below

const BranchSelectionScreen = () => {
    const { userData, logout, setSelectedBranch, selectedBranch } = useContext(AuthContext);
    const navigation = useNavigation();
    const [branches, setBranches] = useState([]);
    const [selectingBranchId, setSelectingBranchId] = useState(null);

    useEffect(() => {
        if (userData && userData.sucursales) {
            setBranches(userData.sucursales);
        }
    }, [userData]);

    // REVERTED: Auto-forward logic removed to restore stability.

    const handleSelectBranch = async (branch) => {
        /**
         * Maneja la selección de una sucursal.
         * 1. Guarda la sucursal seleccionada en el contexto y almacenamiento local.
         * 2. Verifica si hay órdenes pendientes (locales o en backend).
         * 3. Redirige al Dashboard o directamente al Wizard según el estado.
         */
        if (selectingBranchId) return; // Prevent multiple clicks
        setSelectingBranchId(branch.id);
        setSelectedBranch(branch);

        try {
            await AsyncStorage.setItem('selected_branch', JSON.stringify(branch));
        } catch (e) {
            console.log("Error saving branch", e);
        }

        // All selections lead to Dashboard
        navigation.navigate('Dashboard');
        setSelectingBranchId(null);
    };

    const handleLogout = () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro que deseas salir?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Salir", onPress: logout }
            ]
        );
    };

    if (!userData) {
        return (
            <View style={styles.container}>
                <Text>Cargando datos de usuario...</Text>
            </View>
        );
    }

    // Case 0: No branches
    if (!branches || branches.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <MaterialCommunityIcons name="alert-circle" size={50} color="#FF5252" />
                    <Text style={styles.errorTitle}>Acceso Denegado</Text>
                    <Text style={styles.errorText}>
                        Tu usuario no tiene ninguna sucursal asignada.
                        Por favor, contacta al departamento de Sistemas.
                    </Text>
                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Image source={require('../../assets/logo_nieto.png')} style={styles.logo} resizeMode="contain" />
                <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
                    <MaterialCommunityIcons name="logout" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.welcomeText}>Bienvenido,</Text>
                <Text style={styles.userName}>{userData.nombre} {userData.apellido}</Text>

                <Text style={styles.instructionText}>Selecciona una sucursal para continuar:</Text>

                <FlatList
                    data={branches}
                    keyExtractor={(item) => (item.id || item.SucursalID || Math.random()).toString()}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item }) => {
                        const isSelected = selectingBranchId === item.id;
                        const isDisabled = selectingBranchId !== null;

                        return (
                            <TouchableOpacity
                                style={[styles.branchCard, isSelected && { borderColor: '#007bff', borderWidth: 1, backgroundColor: '#f0f8ff' }, isDisabled && !isSelected && { opacity: 0.5 }]}
                                onPress={() => handleSelectBranch(item)}
                                disabled={isDisabled}
                            >
                                <View style={styles.branchIcon}>
                                    <MaterialCommunityIcons name="store" size={30} color="#007bff" />
                                </View>
                                <View style={styles.branchInfo}>
                                    <Text style={styles.branchName}>{item.nombre}</Text>
                                    <Text style={styles.branchId}>Sucursal #{item.id}</Text>
                                </View>
                                {isSelected ? (
                                    <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={{ width: 14, height: 14, borderRadius: 7, borderTopWidth: 2, borderColor: '#007bff' }} />
                                    </View>
                                ) : (
                                    <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10, // Adjust for status bar if needed
        marginBottom: 20,
    },
    logo: {
        width: 150,
        height: 50,
    },
    logoutIcon: {
        padding: 5,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    welcomeText: {
        fontSize: 18,
        color: '#666',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
    },
    instructionText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 15,
        fontWeight: '500',
    },
    listContainer: {
        paddingBottom: 20,
    },
    branchCard: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    branchIcon: {
        backgroundColor: '#e3f2fd',
        padding: 10,
        borderRadius: 10,
        marginRight: 15,
    },
    branchInfo: {
        flex: 1,
    },
    branchName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    branchId: {
        fontSize: 12,
        color: '#999',
    },
    // Error screens
    card: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 3,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
        marginBottom: 10,
    },
    errorText: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 20,
        lineHeight: 20,
    },
    logoutButton: {
        backgroundColor: '#FF5252',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default BranchSelectionScreen;
