import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image, Platform, FlatList, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AgendaBoard from '../components/AgendaBoard';
import { getOrdersList } from '../services/orders';

const OrderSearchScreen = ({ navigation }) => {
    /**
     * Pantalla Consultar Orden de Servicio.
     * Alberga el menú tipo tabs (Lista vs Agenda) y renderiza el componente AgendaBoard.
     */
    const [activeTab, setActiveTab] = useState('Lista');
    const [ordersList, setOrdersList] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(false);

    useEffect(() => {
        if (activeTab === 'Lista') {
            fetchOrders();
        }
    }, [activeTab]);

    const fetchOrders = async () => {
        setIsLoadingList(true);
        try {
            const data = await getOrdersList();
            setOrdersList(data || []);
        } catch (error) {
            console.error("Error cargando lista de órdenes:", error);
            alert("No se pudo cargar la lista de órdenes.");
        } finally {
            setIsLoadingList(false);
        }
    };

    const handleOrderPress = (ordenId) => {
        // Navegamos a la nueva pantalla mandando el ID
        navigation.navigate('OrderDetail', { ordenId });
    };

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity style={styles.orderCard} onPress={() => handleOrderPress(item.OrdenID)}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardOrderId}>{item.OrdenIDGen || `ID: ${item.OrdenID}`}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.OrdenTipo === '1' ? '#E8F4FD' : '#E8F4FD' }]}>
                    <Text style={styles.statusText}>Tipo {item.OrdenTipo}</Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                    <MaterialCommunityIcons name="account" size={16} color="#666" />
                    <Text style={styles.cardText} numberOfLines={1}>{item.ClienteNombre || 'Sin Cliente Asignado'}</Text>
                </View>
                <View style={styles.cardRow}>
                    <MaterialCommunityIcons name="car" size={16} color="#666" />
                    <Text style={styles.cardText}>{item.VehiculoPlacas || 'Sin Placas'}</Text>
                </View>
                <View style={styles.cardRow}>
                    <MaterialCommunityIcons name="store" size={16} color="#666" />
                    <Text style={styles.cardText}>{item.SucursalNombre} - Asesor: {item.AsesorNombre}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header Section (Consistente con Dashboard) */}
            <View style={styles.header}>
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
                <View style={styles.headerCenter}>
                    <Text style={styles.screenTitle}>Consultar Órdenes</Text>
                </View>
                <View style={styles.headerRight}>
                    {/* Botón de filtro removido por petición del usuario */}
                </View>
            </View>

            {/* Custom Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'Lista' && styles.activeTabButton]}
                    onPress={() => setActiveTab('Lista')}
                >
                    <MaterialCommunityIcons name="format-list-bulleted" size={20} color={activeTab === 'Lista' ? "#007BFF" : "#666"} />
                    <Text style={[styles.tabText, activeTab === 'Lista' && styles.activeTabText]}>Lista de Órdenes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'Agenda' && styles.activeTabButton]}
                    onPress={() => setActiveTab('Agenda')}
                >
                    <MaterialCommunityIcons name="calendar-month" size={20} color={activeTab === 'Agenda' ? "#007BFF" : "#666"} />
                    <Text style={[styles.tabText, activeTab === 'Agenda' && styles.activeTabText]}>Recordatorio de Servicio</Text>
                </TouchableOpacity>
            </View>

            {/* Contenido Principal */}
            <View style={styles.content}>
                {activeTab === 'Agenda' ? (
                    // Componente Agenda Visual (Estructura Gantt / Calendario)
                    <AgendaBoard />
                ) : (
                    // Vista Listado Interactivo
                    <View style={styles.listContainer}>
                        {isLoadingList ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="large" color="#007BFF" />
                                <Text style={styles.loadingText}>Cargando órdenes...</Text>
                            </View>
                        ) : ordersList.length === 0 ? (
                            <View style={styles.centerContainer}>
                                <MaterialCommunityIcons name="format-list-checks" size={60} color="#CCC" />
                                <Text style={styles.placeholderText}>No se encontraron órdenes disponibles en el sistema.</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
                                    <Text style={styles.retryButtonText}>Reintentar Consulta</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={ordersList}
                                keyExtractor={(item) => (item.OrdenID ? item.OrdenID.toString() : Math.random().toString())}
                                renderItem={renderOrderItem}
                                contentContainerStyle={styles.flatListContent}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerCenter: {
        flex: 2,
        alignItems: 'center',
    },
    headerRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    logo: {
        width: 80,
        height: 30,
    },
    screenTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    actionButton: {
        padding: 5,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginRight: 10,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: '#007BFF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginLeft: 8,
    },
    activeTabText: {
        color: '#007BFF',
    },
    content: {
        flex: 1,
        padding: 10,
    },
    listContainer: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
    },
    placeholderText: {
        marginTop: 15,
        fontSize: 15,
        color: '#999',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007BFF',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    flatListContent: {
        paddingBottom: 20,
        paddingTop: 5,
    },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#007BFF',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardOrderId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        color: '#0056b3',
        fontWeight: '600',
    },
    cardBody: {
        marginTop: 5,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#555',
        flex: 1,
    }
});

export default OrderSearchScreen;
