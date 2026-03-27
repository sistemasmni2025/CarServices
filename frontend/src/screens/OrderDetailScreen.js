import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image, ScrollView, ActivityIndicator, Modal, FlatList, Dimensions, useWindowDimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getOrdersList } from '../services/orders';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OrderDetailScreen = ({ route, navigation }) => {
    const { width } = useWindowDimensions();
    const { ordenId, ordenIdGen } = route.params || {};
    const [orderDetails, setOrderDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const flatListRef = React.useRef(null);

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
            // console.error("Error al traer detalles de la orden en nueva pantalla:", error);
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
        const inspectionsList = orderData.Inspeccion || [];

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
                        <Text style={styles.detailText}>
                            {orderInfo.OrdenKM || orderInfo.OrdenKilometraje || vehicleInfo.VehiculoKilometraje 
                                ? `${orderInfo.OrdenKM || orderInfo.OrdenKilometraje || vehicleInfo.VehiculoKilometraje} km` 
                                : 'Kilometraje No Disponible'}
                        </Text>
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

                {inspectionsList && inspectionsList.length > 0 && (
                    <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Inspección Vehicular</Text>
                        <Text style={[styles.detailText, {fontSize: 12, fontStyle: 'italic', marginBottom: 10, marginLeft: 0, color: '#666'}]}>Puntos Verificados:</Text>
                        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                            {inspectionsList.map((item, index) => (
                                <View key={index} style={{width: '33.33%', marginBottom: 12, paddingRight: 10, flexDirection: 'row', alignItems: 'flex-start'}}>
                                    <View style={[
                                        styles.detailToggleBtn, 
                                        item.InspeccionValor === 1 ? styles.detailToggleSi : styles.detailToggleNo
                                    ]}>
                                        <Text style={[
                                            styles.detailToggleText, 
                                            item.InspeccionValor === 1 ? styles.detailToggleTextSi : styles.detailToggleTextNo
                                        ]}>
                                            {item.InspeccionValor === 1 ? 'SI' : 'NO'}
                                        </Text>
                                    </View>
                                    <View style={{flex: 1}}>
                                        <Text style={{fontSize: 11, color: '#333', textTransform: 'uppercase', paddingTop: 3}}>{item.ValoracionDescripcion}</Text>
                                        {item.InspeccionValor === 0 && item.InspeccionDescripcion ? (
                                            <Text style={{fontSize: 10, color: '#dc3545', fontStyle: 'italic', marginTop: 2}}>
                                                Motivo: {item.InspeccionDescripcion}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

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
                                    onPress={() => {
                                        setCurrentPhotoIndex(index);
                                        setViewerVisible(true);
                                    }}
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

            {/* Modal de Visor de Fotos tipo Carrusel */}
            <Modal
                visible={viewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setViewerVisible(false)}
            >
                <SafeAreaView style={styles.modalBackground}>
                    <View style={styles.carouselHeader}>
                        <TouchableOpacity 
                            style={styles.carouselCloseButton} 
                            onPress={() => setViewerVisible(false)}
                        >
                            <MaterialCommunityIcons name="close" size={30} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.carouselContent, { flex: 1, flexDirection: 'row', alignItems: 'center', width, height: '100%' }]}>
                        {Platform.OS === 'web' && currentPhotoIndex > 0 && (
                            <TouchableOpacity 
                                style={[styles.navButton, styles.navButtonLeft]} 
                                onPress={() => {
                                    const newIndex = currentPhotoIndex - 1;
                                    setCurrentPhotoIndex(newIndex);
                                    flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
                                }}
                            >
                                <MaterialCommunityIcons name="chevron-left" size={50} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                        )}

                        {Platform.OS === 'web' ? (
                            <View style={[styles.carouselSlide, { width, height: '100%', flex: 1 }]}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                                    {orderDetails?.Fotos[currentPhotoIndex] ? (
                                        <Image 
                                            source={{ uri: orderDetails.Fotos[currentPhotoIndex].FotografiaURL }} 
                                            style={{ width: width * 0.9, height: '80%' }} 
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <Text style={{ color: '#FFF' }}>Cargando imagen...</Text>
                                    )}
                                </View>
                                <View style={styles.photoIndicatorContainer}>
                                    <Text style={styles.photoIndicatorText}>
                                        {orderDetails?.Fotos[currentPhotoIndex]?.TipoEvidenciaDescripcion || 'Evidencia'} ({currentPhotoIndex + 1} / {(orderDetails?.Fotos || []).length})
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                key={width}
                                data={orderDetails?.Fotos || []}
                                horizontal
                                pagingEnabled
                                initialScrollIndex={currentPhotoIndex}
                                getItemLayout={(data, index) => ({
                                    length: width,
                                    offset: width * index,
                                    index,
                                })}
                                keyExtractor={(item, index) => index.toString()}
                                showsHorizontalScrollIndicator={false}
                                onScrollToIndexFailed={info => {
                                    const wait = new Promise(resolve => setTimeout(resolve, 100));
                                    wait.then(() => {
                                        flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                                    });
                                }}
                                onMomentumScrollEnd={(e) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.x / (width || 1));
                                    setCurrentPhotoIndex(index);
                                }}
                                style={{ flex: 1, width: '100%' }}
                                contentContainerStyle={{ flexGrow: 1 }}
                                renderItem={({ item, index }) => (
                                    <View style={[styles.carouselSlide, { width, height: '100%' }]}>
                                        <ScrollView
                                            maximumZoomScale={3}
                                            minimumZoomScale={1}
                                            showsHorizontalScrollIndicator={false}
                                            showsVerticalScrollIndicator={false}
                                            contentContainerStyle={[styles.zoomWrapper, { width }]}
                                        >
                                            <Image 
                                                source={{ uri: item.FotografiaURL }} 
                                                style={[styles.fullImage, { width }]} 
                                                resizeMode="contain"
                                            />
                                        </ScrollView>
                                        <View style={styles.photoIndicatorContainer}>
                                            <Text style={styles.photoIndicatorText}>
                                                {item.TipoEvidenciaDescripcion || 'Evidencia'} ({index + 1} / {(orderDetails?.Fotos || []).length})
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            />
                        )}

                        {Platform.OS === 'web' && currentPhotoIndex < (orderDetails?.Fotos || []).length - 1 && (
                            <TouchableOpacity 
                                style={[styles.navButton, styles.navButtonRight]} 
                                onPress={() => {
                                    const newIndex = currentPhotoIndex + 1;
                                    setCurrentPhotoIndex(newIndex);
                                    flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
                                }}
                            >
                                <MaterialCommunityIcons name="chevron-right" size={50} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>
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
    carouselHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
        zIndex: 20,
    },
    carouselCloseButton: {
        padding: 10,
    },
    carouselSlide: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    carouselContent: {
        flex: 1,
        zIndex: 5,
    },
    zoomWrapper: {
        flex: 1,
        width: SCREEN_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoIndicatorContainer: {
        position: 'absolute',
        bottom: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    photoIndicatorText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    navButton: {
        position: 'absolute',
        zIndex: 30,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 40,
    },
    navButtonLeft: {
        left: 20,
    },
    navButtonRight: {
        right: 20,
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
    detailToggleBtn: {
        width: 32,
        height: 22,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
    },
    detailToggleSi: {
        backgroundColor: '#d4edda',
        borderColor: '#c3e6cb',
    },
    detailToggleNo: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
    },
    detailToggleText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    detailToggleTextSi: {
        color: '#155724',
    },
    detailToggleTextNo: {
        color: '#666',
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
        backgroundColor: '#000', // Black for focused viewing
    },
    fullImage: {
        width: SCREEN_WIDTH,
        height: '100%',
    },
});

export default OrderDetailScreen;
