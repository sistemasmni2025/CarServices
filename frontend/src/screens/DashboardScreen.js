import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image, Dimensions, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { logout } from '../services/auth';
import { getPendingOrder, cancelOrder } from '../services/orders';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
    const { userName, logout, selectedBranch, userData } = useContext(AuthContext);

    useEffect(() => {
        const checkPendingBackend = async (branchId, userId) => {
            try {
                const order = await getPendingOrder(branchId, userId);
                if (order) {
                    const clientName = order.cliente ? (order.cliente.razon_social || order.cliente.nombre) : 'Sin Cliente';
                    const vehicleInfo = order.vehiculo ? `${order.vehiculo.marca} ${order.vehiculo.modelo} (${order.vehiculo.placas})` : 'Sin Vehículo';

                    if (Platform.OS === 'web') {
                        const confirmMsg = `Orden #${order.no_orden} (${order.estatus})\n\nCliente: ${clientName}\nVehículo: ${vehicleInfo}\n\n¿Deseas retomarla o cancelarla?`;
                        if (window.confirm(confirmMsg + "\n\n[OK] = Continuar Captura\n[Cancel] = Cancelar Orden")) {
                            const key = `WEBSESSION_ORDEN_${userData.id}_${selectedBranch.id}`;

                            // Map Backend Order to Wizard Data
                            const mappedData = {
                                ingreso: {
                                    serie: order.serie,
                                    noOrden: String(order.no_orden),
                                    tipoOrden: order.tipo_orden,
                                    fecha: order.fecha,
                                    unidadNegocio: order.unidad_negocio,
                                    asesor: String(order.asesor_id),
                                    servicioForaneo: order.servicio_foraneo || 'Ninguno',
                                    horaIngreso: order.fecha_ingreso,
                                    fechaEntrega: order.fecha_entrega,
                                    horaEntrega: ''
                                },
                                cliente: order.cliente ? {
                                    id: order.cliente.id,
                                    codigo: order.cliente.codigo,
                                    nombre: order.cliente.nombre,
                                    rfc: order.cliente.rfc,
                                    razon_social: order.cliente.razon_social,
                                    domicilio: order.cliente.domicilio,
                                    ciudad: order.cliente.ciudad,
                                    estado: order.cliente.estado,
                                    cp: order.cliente.cp,
                                    telefono: order.cliente.telefono,
                                    email: order.cliente.email
                                } : null,
                                vehiculo: order.vehiculo ? {
                                    style: null,
                                    details: {
                                        tag: order.vehiculo.placas,
                                        brand: order.vehiculo.marca,
                                        model: order.vehiculo.modelo,
                                        year: String(order.vehiculo.anio),
                                        color: order.vehiculo.color,
                                        mileage: String(order.vehiculo.km),
                                        chassis: order.vehiculo.no_serie
                                    }
                                } : { style: null, details: {} },
                                fotos: {
                                    frontal: null, lateralIzquierdo: null, lateralDerecho: null, trasero: null,
                                    interior1: null, interior2: null, interior3: null, interior4: null, adicional: null
                                }
                            };

                            await AsyncStorage.setItem(key, JSON.stringify({ data: mappedData, step: 'resumen', timestamp: Date.now() }));
                            navigation.navigate('Wizard');
                        } else {
                            if (window.confirm("¿Seguro que deseas CANCELAR esta orden permanentemente?")) {
                                try {
                                    await cancelOrder(order.id);
                                    Alert.alert("Cancelado", "La orden ha sido cancelada exitosamente.");
                                    const key = `WEBSESSION_ORDEN_${userData.id}_${selectedBranch.id}`;
                                    await AsyncStorage.removeItem(key);
                                } catch (e) {
                                    console.log(e);
                                    Alert.alert("Error", "No se pudo cancelar la orden en el servidor.");
                                }
                            }
                        }
                        return;
                    }

                    Alert.alert(
                        "Orden Pendiente en Sistema",
                        `Orden #${order.no_orden} (${order.estatus})\n\nCliente: ${clientName}\nVehículo: ${vehicleInfo}\n\n¿Deseas retomarla o cancelarla?`,
                        [
                            {
                                text: "Cancelar Orden",
                                onPress: async () => {
                                    try {
                                        await cancelOrder(order.id);
                                        Alert.alert("Cancelado", "La orden ha sido cancelada exitosamente y el estado se ha limpiado.");
                                        // Ensure local storage is also clean for this order if it matches
                                        const key = `WEBSESSION_ORDEN_${userData.id}_${selectedBranch.id}`;
                                        await AsyncStorage.removeItem(key);
                                    } catch (e) {
                                        console.log(e);
                                        Alert.alert("Error", "No se pudo cancelar la orden en el servidor.");
                                    }
                                },
                                style: "destructive"
                            },
                            {
                                text: "Continuar Captura",
                                onPress: async () => {
                                    const key = `WEBSESSION_ORDEN_${userData.id}_${selectedBranch.id}`;

                                    // Map Backend Order to Wizard Data
                                    const mappedData = {
                                        ingreso: {
                                            serie: order.serie,
                                            noOrden: String(order.no_orden),
                                            tipoOrden: order.tipo_orden,
                                            fecha: order.fecha,
                                            unidadNegocio: order.unidad_negocio,
                                            asesor: String(order.asesor_id),
                                            servicioForaneo: order.servicio_foraneo || 'Ninguno',
                                            horaIngreso: order.fecha_ingreso,
                                            fechaEntrega: order.fecha_entrega,
                                            horaEntrega: ''
                                        },
                                        cliente: order.cliente ? {
                                            id: order.cliente.id,
                                            codigo: order.cliente.codigo,
                                            nombre: order.cliente.nombre,
                                            rfc: order.cliente.rfc,
                                            razon_social: order.cliente.razon_social,
                                            domicilio: order.cliente.domicilio,
                                            ciudad: order.cliente.ciudad,
                                            estado: order.cliente.estado,
                                            cp: order.cliente.cp,
                                            telefono: order.cliente.telefono,
                                            email: order.cliente.email
                                        } : null,
                                        vehiculo: order.vehiculo ? {
                                            style: null,
                                            details: {
                                                tag: order.vehiculo.placas,
                                                brand: order.vehiculo.marca,
                                                model: order.vehiculo.modelo,
                                                year: String(order.vehiculo.anio),
                                                color: order.vehiculo.color,
                                                mileage: String(order.vehiculo.km),
                                                chassis: order.vehiculo.no_serie
                                            }
                                        } : { style: null, details: {} },
                                        fotos: {
                                            frontal: null, lateralIzquierdo: null, lateralDerecho: null, trasero: null,
                                            interior1: null, interior2: null, interior3: null, interior4: null, adicional: null
                                        }
                                    };

                                    await AsyncStorage.setItem(key, JSON.stringify({ data: mappedData, step: 'resumen', timestamp: Date.now() }));
                                    navigation.navigate('Wizard');
                                }
                            }
                        ]
                    );
                }
            } catch (e) {
                // Silent fail
            }
        };

        const checkPending = async () => {
            /**
             * Verifica si existen órdenes pendientes para el usuario y sucursal actuales.
             * 1. Revisa almacenamiento local (Borrador Wizard).
             * 2. Si no hay local, revisa en el Backend.
             * 3. Muestra alertas para retomar o cancelar/descartar.
             */
            if (!userData || !userData.id) return;

            // 1. Revisar Borrador Local (Wizard en progreso)
            try {
                const key = `WEBSESSION_ORDEN_${userData.id}_${selectedBranch?.id}`; // Corregido key para incluir sucursal
                const localState = await AsyncStorage.getItem(key);

                if (localState) {
                    const parsed = JSON.parse(localState);
                    const { ingreso, cliente, vehiculo } = parsed.data || {};

                    const clientName = cliente ? (cliente.razon_social || cliente.nombre) : 'Cliente No Registrado';
                    const vehicleInfo = vehiculo && vehiculo.details ? `${vehiculo.details.brand} ${vehiculo.details.model} (${vehiculo.details.tag})` : 'Vehículo Pendiente';
                    const orderDate = ingreso ? ingreso.fecha : 'Fecha Desconocida';

                    if (Platform.OS === 'web') {
                        // Lógica específica para Web
                        const confirmMsg = `Se encontró una orden no finalizada:\n\nCliente: ${clientName}\nVehículo: ${vehicleInfo}\nFecha: ${orderDate}\n\n¿Deseas continuar con este registro?`;
                        if (window.confirm(confirmMsg)) {
                            navigation.navigate('Wizard');
                        } else {
                            if (window.confirm("¿Deseas descartar y limpiar el borrador local?")) {
                                await AsyncStorage.removeItem(key);
                                Alert.alert("Limpio", "El borrador local ha sido eliminado.");
                                // Re-check backend immediately after clearing local
                                checkPendingBackend(selectedBranch.id, userData.id);
                            }
                        }
                        return;
                    }

                    Alert.alert(
                        "Continuar Captura",
                        `Se encontró una orden no finalizada:\n\nCliente: ${clientName}\nVehículo: ${vehicleInfo}\nFecha: ${orderDate}\n\n¿Deseas continuar con este registro?`,
                        [
                            {
                                text: "Descartar y Limpiar",
                                onPress: async () => {
                                    await AsyncStorage.removeItem(key);
                                    Alert.alert("Limpio", "El borrador local ha sido eliminado.");
                                    // Revisa backend inmediatamente después de limpiar local
                                    checkPendingBackend(selectedBranch.id, userData.id);
                                },
                                style: "destructive"
                            },
                            {
                                text: "Continuar",
                                onPress: () => {
                                    navigation.navigate('Wizard');
                                }
                            }
                        ]
                    );
                    return;
                }
            } catch (e) {
                console.log("Error checking local draft", e);
            }

            // 2. Revisar Backend si no hay local
            if (userData?.id && selectedBranch?.id) {
                checkPendingBackend(selectedBranch.id, userData.id);
            }
        };

        const unsubscribe = navigation.addListener('focus', () => {
            checkPending();
        });
        return unsubscribe;
    }, [navigation, userData]);

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro que deseas salir?")) {
                logout();
            }
        } else {
            Alert.alert(
                "Cerrar Sesión",
                "¿Estás seguro que deseas salir?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Salir", onPress: logout }
                ]
            );
        }
    };

    const MenuCard = ({ title, subtitle, icon, color, onPress }) => (
        <TouchableOpacity style={[styles.card, { borderLeftColor: color }]} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={40} color={color} />
            </View>
            <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header Section */}
            <View style={styles.header}>
                {/* Left: Back & Logo */}
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <Image
                        source={require('../../assets/logo_nieto.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Center: Branch Name */}
                <View style={styles.headerCenter}>
                    {selectedBranch && (
                        <Text style={styles.branchName}>{selectedBranch.nombre}</Text>
                    )}
                </View>

                {/* Right: User Name & Logout */}
                <View style={styles.headerRight}>
                    <View style={styles.userInfo}>
                        <Text style={styles.welcomeText}>Bienvenido,</Text>
                        <Text style={styles.userName}>{userName || 'Usuario'}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <MaterialCommunityIcons name="logout" size={24} color="#FF5252" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>¿Qué desea realizar hoy?</Text>

                {/* Main Menu Options */}
                <MenuCard
                    title="Consultar Orden de Servicio"
                    subtitle="Buscar y gestionar órdenes existentes"
                    icon="magnify"
                    color="#007BFF"
                    onPress={() => navigation.navigate('OrderSearch')}
                />

                <MenuCard
                    title="Realizar Orden de Servicio"
                    subtitle="Iniciar nuevo registro de servicio (Ingreso)"
                    icon="plus-circle-outline"
                    color="#28A745"
                    onPress={() => navigation.navigate('Wizard')}
                />

                {/* Optional Footer/Status Info */}
                <View style={styles.infoBox}>
                    <MaterialCommunityIcons name="information-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                        Recuerde capturar todas las fotos de evidencia al realizar un nuevo ingreso.
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Multillantas Nieto © 2026</Text>
                <Text style={styles.versionText}>v1.2.5</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerCenter: {
        flex: 1, // Takes up center space
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    backButton: {
        marginRight: 10,
        padding: 5,
    },
    logo: {
        width: 100,
        height: 35,
    },
    branchName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007BFF',
        textAlign: 'center',
    },
    userInfo: {
        alignItems: 'flex-end',
        marginRight: 15,
    },
    welcomeText: {
        fontSize: 12,
        color: '#666',
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    logoutButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#FFF5F5',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 25,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 5,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        // Elevation for Android
        elevation: 3,
    },
    iconContainer: {
        padding: 12,
        borderRadius: 12,
        marginRight: 20,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#777',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E9ECEF',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#666',
        marginLeft: 10,
        lineHeight: 18,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
    versionText: {
        fontSize: 10,
        color: '#CCC',
        marginTop: 4,
    }
});

export default DashboardScreen;
