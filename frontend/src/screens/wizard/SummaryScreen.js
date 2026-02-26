import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SignatureModal from '../../components/SignatureModal';

const { width } = Dimensions.get('window');

const SummarySection = ({ title, icon, children }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <MaterialCommunityIcons name={icon} size={20} color="#007bff" />
            <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <View style={styles.cardContent}>
            {children}
        </View>
    </View>
);

const InfoRow = ({ label, value, colorIndicator }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}:</Text>
        <View style={styles.infoValueContainer}>
            {colorIndicator && <View style={[styles.colorCircle, { backgroundColor: colorIndicator }]} />}
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    </View>
);

const InventoryRow = ({ label, isPresent }) => (
    <View style={styles.inventoryRow}>
        <Text style={styles.inventoryLabelText}>{label}</Text>
        <View style={[styles.inventoryBadge, isPresent ? styles.badgeYes : styles.badgeNo]}>
            <Text style={styles.badgeText}>{isPresent ? 'SI' : 'NO'}</Text>
        </View>
    </View>
);

const InventorySubsection = ({ title, items, data }) => (
    <View style={styles.inventorySubsection}>
        <Text style={styles.inventorySubsectionTitle}>{title}</Text>
        <View style={styles.inventoryGrid}>
            {items.map((item, index) => (
                <View key={index} style={styles.inventoryGridItem}>
                    <InventoryRow label={item} isPresent={data && data[item]} />
                </View>
            ))}
        </View>
    </View>
);

const SummaryScreen = ({ wizardData, onUpdate, onFinish }) => {
    /**
     * Paso 5 del Wizard: Resumen y Firma.
     * Muestra todos los datos recolectados (Cliente, Vehículo, Inspección, Fotos).
     * Permite firmar la orden y finalizar el proceso.
     */
    const [modalVisible, setModalVisible] = useState(false);
    const [signature, setSignature] = useState(wizardData.firma || null);
    const colorNameMap = {
        'BLANCO': '#FFFFFF',
        'NEGRO': '#000000',
        'GRIS RATÓN': '#4B4B4B',
        'PLATA': '#C0C0C0',
        'GRIS OXFORD': '#353839',
        'VINCULACIÓN': '#E5E4E2',
        'ROJO': '#FF0000',
        'VINO': '#722F37',
        'AZUL': '#0000FF',
        'AZUL MARINO': '#000080',
        'VERDE': '#008000',
        'AMARILLO': '#FFFF00',
        'BEIGE': '#F5F5DC',
        'CAFÉ': '#A52A2A',
        'OTRO': '#CCCCCC'
    };

    // Extract actual data from wizardData
    const vehicleDetails = wizardData?.vehiculo?.details || {};
    const vehicleColorName = vehicleDetails.color || "---";
    const mappedHex = colorNameMap[vehicleColorName.toString().toUpperCase()] || "#FFFFFF";
    const inventoryData = vehicleDetails.inventory || {};

    const orderData = {
        id: wizardData.ingreso.noOrden || 'PENDIENTE',
        client: {
            name: wizardData.cliente ? wizardData.cliente.nombre : "No seleccionado",
            rfc: wizardData.cliente ? wizardData.cliente.rfc : "---",
            address: wizardData.cliente ? wizardData.cliente.domicilio : "---",
            city: wizardData.cliente ? wizardData.cliente.ciudad : "---",
            phone: wizardData.cliente ? wizardData.cliente.telefono : "---",
            email: wizardData.cliente ? wizardData.cliente.email : "---",
            type: wizardData.cliente ? (wizardData.cliente.regimen_fiscal || "---") : "---"
        },
        vehicle: {
            brand: vehicleDetails.brand || "---",
            model: vehicleDetails.model || "---",
            year: vehicleDetails.year || "---",
            color: vehicleColorName,
            hexColor: vehicleDetails.colorHex || mappedHex,
            fuel: `${vehicleDetails.fuelLevel || 0}%`,
            plate: vehicleDetails.tag || "---",
            serial: vehicleDetails.chassis || "---",
            engine: vehicleDetails.motor || "---",
            mileage: vehicleDetails.mileage || "---",
            observations: vehicleDetails.observaciones || "---"
        }
    };

    const photos = Object.values(wizardData.fotos || {}).filter(p => p !== null);

    // Inventory Lists (Dynamic now)
    const renderInventory = () => {
        const inventory = wizardData.vehiculo.details.inventory || {};
        const items = Object.entries(inventory).map(([id, itemData]) => {
            if (!itemData) return null;
            // Handle both old boolean format and new object format
            const isChecked = typeof itemData === 'object' ? !!itemData.checked : !!itemData;
            const description = typeof itemData === 'object' ? itemData.descripcion : `Item ${id}`;

            return (
                <View key={id} style={styles.inventoryGridItem}>
                    <InventoryRow label={description || `Item ${id}`} isPresent={isChecked} />
                </View>
            );
        }).filter(item => item !== null);

        return (
            <View style={styles.inventoryGrid}>
                {items.length > 0 ? items : <Text style={{ fontStyle: 'italic', color: '#999' }}>Ningún punto de inspección seleccionado.</Text>}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Resumen de la Orden</Text>
                    <Text style={styles.orderId}>{orderData.id}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>PENDIENTE</Text>
                </View>
            </View>

            <SummarySection title="Sesión y Configuración" icon="clock-outline">
                <InfoRow label="Unidad Negocio" value={wizardData?.ingreso?.unidadNegocio || "---"} />
                <InfoRow label="Asesor" value={wizardData?.ingreso?.asesor || "---"} />
                <InfoRow label="Sucursal" value={wizardData?.session?.sucursalNombre || '---'} />
                <InfoRow label="Fecha Registro" value={wizardData?.ingreso?.fecha || "---"} />
            </SummarySection>

            <SummarySection title="Datos del Cliente" icon="account-details">
                <InfoRow label="Nombre" value={orderData.client.name} />
                <InfoRow label="RFC" value={orderData.client.rfc} />
                <InfoRow label="Dirección" value={orderData.client.address} />
                <InfoRow label="Ciudad" value={orderData.client.city} />
                <InfoRow label="Teléfono" value={orderData.client.phone} />
                <InfoRow label="E-mail" value={orderData.client.email} />
                <View style={styles.badgeRow}>
                    <View style={styles.clientBadge}>
                        <Text style={styles.clientBadgeText}>Régimen: {orderData.client.type}</Text>
                    </View>
                </View>
            </SummarySection>

            <SummarySection title="Vehículo" icon="car-info">
                <InfoRow label="Marca" value={orderData.vehicle.brand} />
                <InfoRow label="Modelo" value={orderData.vehicle.model} />
                <InfoRow label="Año" value={orderData.vehicle.year} />
                <InfoRow label="Color" value={orderData.vehicle.color} colorIndicator={orderData.vehicle.hexColor} />
                <InfoRow label="Placas" value={orderData.vehicle.plate} />
                <InfoRow label="VIN / Serie" value={orderData.vehicle.serial} />
                <InfoRow label="Motor" value={orderData.vehicle.engine} />
                <InfoRow label="Kilometraje" value={`${orderData.vehicle.mileage} km`} />
                <InfoRow label="Combustible" value={orderData.vehicle.fuel} />
                {orderData.vehicle.observations !== "---" && (
                    <View style={{ marginTop: 5 }}>
                        <Text style={[styles.infoLabel, { width: '100%' }]}>Observaciones:</Text>
                        <Text style={[styles.infoValue, { fontStyle: 'italic', fontWeight: 'normal' }]}>
                            {orderData.vehicle.observations}
                        </Text>
                    </View>
                )}
            </SummarySection>

            <SummarySection title="Inspección Vehícular" icon="clipboard-list">
                <View style={styles.inventorySubsection}>
                    <Text style={{ marginBottom: 10, fontStyle: 'italic', fontSize: 12 }}>Puntos Verificados:</Text>
                    {renderInventory()}
                </View>
            </SummarySection>

            <SummarySection title="Evidencia Fotográfica" icon="camera-burst">
                <Text style={styles.evidenceText}>
                    Se capturaron {photos.length} fotografías de evidencia.
                </Text>
                <View style={styles.photoGrid}>
                    {photos.length > 0 ? (
                        photos.map((photoUri, index) => {
                            const source = { uri: photoUri };
                            return (
                                <View key={index} style={styles.photoContainer}>
                                    <Image
                                        source={source}
                                        style={styles.photoThumb}
                                        resizeMode="cover"
                                    />
                                </View>
                            );
                        })
                    ) : (
                        <Text style={{ fontStyle: 'italic', color: '#999', marginVertical: 10 }}>No hay fotos.</Text>
                    )}
                </View>
            </SummarySection>

            <View style={{ marginTop: 10, marginBottom: 10 }}>
                <TouchableOpacity style={styles.signButton} onPress={() => setModalVisible(true)}>
                    <MaterialCommunityIcons name="pen" size={20} color="#fff" />
                    <Text style={styles.signButtonText}>
                        {signature ? 'Documento Firmado' : 'Firmar Contrato'}
                    </Text>
                    {signature && <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />}
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.finishButton, !signature && styles.disabledButton]}
                    onPress={() => {
                        if (!signature) {
                            Alert.alert('Firma Requerida', 'Por favor firme el documento antes de finalizar.');
                            return;
                        }
                        onFinish({ ...wizardData, firma: signature });
                    }}
                >
                    <Text style={styles.finishButtonText}>Finalizar y Guardar Orden</Text>
                    <MaterialCommunityIcons name="check-decagram" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <SignatureModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={(sig) => {
                    setSignature(sig);
                    if (onUpdate) onUpdate(sig);
                    setModalVisible(false);
                }}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        padding: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007bff',
        letterSpacing: 1,
        marginTop: 2,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        backgroundColor: '#ffc107',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusText: {
        color: '#333',
        fontSize: 11,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#444',
    },
    cardContent: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoLabel: {
        fontSize: 13,
        color: '#777',
        width: 110,
    },
    infoValueContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    colorCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    badgeRow: {
        marginTop: 5,
    },
    clientBadge: {
        backgroundColor: '#e7f1ff',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    clientBadgeText: {
        color: '#007bff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    evidenceText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 10,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    photoContainer: {
        width: 70,
        height: 70,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    photoThumb: {
        width: '100%',
        height: '100%',
    },
    footer: {
        paddingTop: 20,
        paddingBottom: 40,
    },
    finishButton: {
        backgroundColor: '#28a745',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 4,
        gap: 10,
    },
    finishButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    signButton: {
        backgroundColor: '#007bff',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 15,
        elevation: 2,
        gap: 10,
    },
    signButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Inventory Styles
    inventorySubsection: {
        marginBottom: 15,
    },
    inventorySubsectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#555',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 4,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    inventoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    inventoryGridItem: {
        width: '50%',
        paddingRight: 5,
        marginBottom: 5,
    },
    inventoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    inventoryLabelText: {
        fontSize: 12,
        color: '#444',
        flex: 1,
        marginRight: 5,
    },
    inventoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        minWidth: 35,
        alignItems: 'center',
    },
    badgeYes: {
        backgroundColor: '#d4edda',
        borderWidth: 1,
        borderColor: '#c3e6cb',
    },
    badgeNo: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333',
    }
});

export default SummaryScreen;
