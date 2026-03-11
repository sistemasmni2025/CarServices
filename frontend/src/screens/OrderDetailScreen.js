import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getOrdersList } from '../services/orders';

const OrderDetailScreen = ({ route, navigation }) => {
    const { ordenId, ordenIdGen } = route.params || {};
    const [orderDetails, setOrderDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null); // Estado para imagen grande

    useEffect(() => {
        if (ordenId) {
            fetchOrderDetails();
        } else {
            setIsLoading(false);
        }
    }, [ordenId]);

    const fetchOrderDetails = async () => {
        setIsLoading(true);
        try {
            const details = await getOrdersList(ordenId);
            setOrderDetails(details);
        } catch (error) {
            console.error("Error al traer detalles de la orden en nueva pantalla:", error);
            setOrderDetails({ error: "No se pudo cargar el detalle. Por favor reintente." });
        } finally {
            setIsLoading(false);
        }
    };

    const renderDetails = () => {
        if (!orderDetails) return null;

        if (orderDetails.error) return <Text style={[styles.errorText, { color: '#DC3545' }]}>{orderDetails.error}</Text>;

        // La API a veces retorna un array (cuando buscas lista)
        // pero cuando buscas una sola orden retorna un objeto anidado:
        // { "Orden": {...}, "Cliente": {...}, "Vehiculo": {...} }
        const orderData = Array.isArray(orderDetails) ? orderDetails[0] : orderDetails;

        // Manejamos dinámicamente si los datos vienen encapsulados (vista detalle) o planos (vista lista)
        const orderInfo = orderData.Orden || orderData;
        const clientInfo = orderData.Cliente || orderData;
        const vehicleInfo = orderData.Vehiculo || orderData;
        const photosList = orderData.Fotos || [];

        if (!orderInfo || !orderInfo.OrdenID) return <Text style={styles.errorText}>No se encontraron datos de la orden.</Text>;

        // El ID de sucursal parece venir de `orderInfo.SucursalID` pero a veces el backend no envía el nombre directo (`orderData.SucursalNombre`) sino anidado.
        const sucursalNombre = clientInfo.SucursalNombre || orderInfo.SucursalNombre || orderData.SucursalNombre || (orderInfo.SucursalID === 1 ? 'CELAYA' : `Sucursal ID: ${orderInfo.SucursalID || 'N/A'}`);
        // El Asesor a veces no manda nombre. Asesor 1 por defecto era Juan Campanur según la UI principal de Ingreso.
        const asesorNombre = orderInfo.AsesorNombre || (orderInfo.AsesorID === 1 ? 'JUAN CAMPANUR' : `ID: ${orderInfo.AsesorID || 'N/A'}`);

        return (
            <View style={styles.detailCard}>
                <View style={styles.detailHeaderBox}>
                    <Text style={styles.detailOrderId}>{ordenIdGen || orderInfo.OrdenIDGen || `Orden ID: ${orderInfo.OrdenID}`}</Text>
                    <View style={styles.detailTypeBadge}>
                        <Text style={styles.detailTypeBadgeText}>Tipo {orderInfo.OrdenTipo || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Información del Cliente</Text>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="account" size={24} color="#666" />
                        <Text style={styles.detailText}>{clientInfo.ClienteNombre || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#666" />
                        <Text style={styles.detailText}>{clientInfo.ClienteRFC || 'RFC No Disponible'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={24} color="#666" />
                        <Text style={styles.detailText}>{clientInfo.ClienteDomicilio ? `${clientInfo.ClienteDomicilio}${clientInfo.ClienteCiudad ? `, ${clientInfo.ClienteCiudad}` : ''}${clientInfo.ClienteEstadoNombre ? `, ${clientInfo.ClienteEstadoNombre}` : ''}` : 'Dirección No Disponible'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="phone-outline" size={24} color="#666" />
                        <Text style={styles.detailText}>{clientInfo.ClienteTelefono || 'Teléfono No Disponible'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="email-outline" size={24} color="#666" />
                        <Text style={styles.detailText}>{clientInfo.ClienteEmail || 'Email No Disponible'}</Text>
                    </View>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Vehículo en Servicio</Text>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="car" size={24} color="#666" />
                        <Text style={styles.detailText}>{vehicleInfo.VehiculoPlacas || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="car-info" size={24} color="#666" />
                        <Text style={styles.detailText}>{vehicleInfo.VehiculoMarca ? `${vehicleInfo.VehiculoMarca} ${vehicleInfo.VehiculoModelo || ''}` : 'Marca/Modelo No Disponible'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="palette-outline" size={24} color="#666" />
                        <Text style={styles.detailText}>{vehicleInfo.VehiculoColor || 'Color No Disponible'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="speedometer" size={24} color="#666" />
                        <Text style={styles.detailText}>{vehicleInfo.VehiculoKilometraje ? `${vehicleInfo.VehiculoKilometraje} km` : 'Kilometraje No Disponible'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="barcode" size={24} color="#666" />
                        <Text style={styles.detailText}>{vehicleInfo.VehiculoNumSerie || 'Serie No Disponible'}</Text>
                    </View>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Fechas y Observaciones</Text>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="calendar-arrow-right" size={24} color="#666" />
                        <Text style={styles.detailText}>Ingreso: {orderInfo.OrdenFechaIngreso ? new Date(orderInfo.OrdenFechaIngreso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="calendar-check" size={24} color="#666" />
                        <Text style={styles.detailText}>Entrega: {orderInfo.OrdenFechaEntrega ? new Date(orderInfo.OrdenFechaEntrega).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Text>
                    </View>
                    <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                        <MaterialCommunityIcons name="text-box-outline" size={24} color="#666" style={{ marginTop: 2 }} />
                        <Text style={[styles.detailText, { fontSize: 16 }]}>{orderInfo.OrdenObservaciones || 'Sin observaciones'}</Text>
                    </View>
                </View>

                <View style={[styles.detailSection, { marginBottom: 0 }]}>
                    <Text style={styles.detailSectionTitle}>Asignación y Supervisión</Text>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="store" size={24} color="#666" />
                        <Text style={styles.detailText}>{sucursalNombre}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="tie" size={24} color="#666" />
                        <Text style={styles.detailText}>Asesor: {asesorNombre}</Text>
                    </View>
                </View>

                {photosList && photosList.length > 0 && (
                    <View style={[styles.detailSection, { marginTop: 25 }]}>
                        <Text style={styles.detailSectionTitle}>Evidencia Fotográfica ({photosList.length})</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryContainer}>
                            {photosList.map((foto, index) => (
                                <TouchableOpacity 
                                    key={foto.EvidenciaID || index} 
                                    style={styles.galleryItem}
                                    onPress={() => setSelectedImage(foto.FotografiaURL)}
                                >
                                    <Image 
                                        source={{ uri: foto.FotografiaURL }} 
                                        style={styles.galleryImage} 
                                        resizeMode="cover"
                                    />
                                    <Text style={styles.galleryLabel} numberOfLines={1}>
                                        {foto.TipoEvidenciaDescripcion || 'FOTO'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header Section */}
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
                    <Text style={styles.screenTitle}>Detalle de Orden</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#007BFF" />
                        <Text style={styles.loadingText}>Consultando información...</Text>
                    </View>
                ) : (
                    renderDetails()
                )}
            </ScrollView>

            {/* Modal de Imagen en Grande */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalBackground}>
                    <TouchableOpacity 
                        style={styles.closeModalArea} 
                        onPress={() => setSelectedImage(null)} 
                    />
                    <View style={styles.imageModalContainer}>
                        <Image 
                            source={{ uri: selectedImage }} 
                            style={styles.fullImage} 
                            resizeMode="contain"
                        />
                        <TouchableOpacity style={styles.closeModalButton} onPress={() => setSelectedImage(null)}>
                            <MaterialCommunityIcons name="close-circle" size={40} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    content: {
        flexGrow: 1,
        padding: 15,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    loadingText: {
        marginTop: 15,
        color: '#666',
        fontSize: 16,
    },
    errorText: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
    },

    // Detalle UI
    detailCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    detailHeaderBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    detailOrderId: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
    },
    detailTypeBadge: {
        backgroundColor: '#E8F4FD',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    detailTypeBadgeText: {
        color: '#0056b3',
        fontWeight: 'bold',
        fontSize: 14,
    },
    detailSection: {
        marginBottom: 25,
    },
    detailSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#999',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailText: {
        marginLeft: 15,
        fontSize: 18,
        color: '#444',
        flex: 1,
    },
    galleryContainer: {
        flexDirection: 'row',
        paddingVertical: 10,
    },
    galleryItem: {
        marginRight: 15,
        alignItems: 'center',
        width: 100,
    },
    galleryImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#E0E0E0',
        marginBottom: 8,
    },
    galleryLabel: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    
    // Modal de imagen
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeModalArea: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    imageModalContainer: {
        width: '90%',
        height: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    closeModalButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    }
});

export default OrderDetailScreen;
