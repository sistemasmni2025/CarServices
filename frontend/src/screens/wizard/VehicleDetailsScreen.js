import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Picker removed
import { registerVehicleSoap } from '../../services/vehicles';
import { getInspectionChecklist } from '../../services/inspections';

// Fixed Fuel Gauge: Single selection highlight
// Fixed Fuel Gauge: Dashboard style
const FuelGauge = ({ value, onChange }) => {
    const levels = [
        { label: 'E', value: 0, color: '#dc3545' }, // Red
        { label: '1/4', value: 25, color: '#ffc107' }, // Yellow
        { label: '1/2', value: 50, color: '#fd7e14' }, // Orange
        { label: '3/4', value: 75, color: '#28a745' }, // Green
        { label: 'F', value: 100, color: '#20c997' } // Teal
    ];

    return (
        <View style={styles.gaugeWrapper}>
            <View style={styles.gaugeHeader}>
                <MaterialCommunityIcons name="gas-station" size={24} color="#666" />
                <Text style={styles.label}>Nivel de Gasolina</Text>
            </View>
            <View style={styles.gaugeContainer}>
                {levels.map((level) => (
                    <TouchableOpacity
                        key={level.value}
                        style={[
                            styles.gaugeSegment,
                            value === level.value && { backgroundColor: level.color, borderColor: level.color, transform: [{ scale: 1.1 }] }
                        ]}
                        onPress={() => onChange(level.value)}
                    >
                        <Text style={[
                            styles.gaugeText,
                            value === level.value && styles.gaugeTextActive
                        ]}>
                            {level.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const VehicleDetailsScreen = ({ data, client, onUpdate, onNext }) => {
    /**
     * Pantalla de Detalles del Vehículo.
     * 1. Formulario de datos del vehículo (Placas, Marca, Modelo, etc.).
     * 2. Medidor visual de gasolina.
     * 3. Checklist de inspección vehicular dinámico.
     */
    const [isColorModalVisible, setIsColorModalVisible] = useState(false);
    const [formData, setFormData] = useState(data || {
        tag: '',
        brand: '',
        model: '',
        year: '',
        color: '',
        chassis: '',
        transmission: 'Automática',
        fuelType: 'Gasolina',
        mileage: '',
        fuelLevel: 50,
        colorHex: '#FFFFFF',
        observaciones: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const [inspectionData, setInspectionData] = useState([]);
    const [loadingInspection, setLoadingInspection] = useState(true);

    // Sync formData with new props defensively
    useEffect(() => {
        if (data) {
            setFormData(data);
        }
    }, [data]);

    // Initialize inventory if not present
    useEffect(() => {
        if (!formData.inventory) {
            setFormData(prev => ({
                ...prev,
                inventory: {} // Changed to flat object for semantic ID storage or maintain category structure?
                // User wants minimal changes. Let's try to maintain structure but mapped by ID?
                // Actually, flat map by ValoracionID is better for database.
                // But SummaryScreen needs keys.
                // Let's store as: inventory: { [ValoracionID]: { checked: true, descripcion: '...' } }
            }));
        }

        loadInspectionChecklist();
    }, []);

    const loadInspectionChecklist = async () => {
        // Carga el catálogo de inspección desde el backend
        try {
            setLoadingInspection(true);
            const response = await getInspectionChecklist();
            if (response && response.success && response.tiposValoracion) {
                setInspectionData(response.tiposValoracion);
            }
        } catch (error) {
            console.error("Failed to load inspection checklist:", error);
            // Fallback or alert?
        } finally {
            setLoadingInspection(false);
        }
    };

    const handleChange = (field, value) => {
        const newForm = { ...formData, [field]: value };
        setFormData(newForm);
        onUpdate(newForm);
    };

    // const years = Array.from({ length: 27 }, (_, i) => (2026 - i).toString()); // Removed

    const handleSelectColor = (color) => {
        const hexDisplay = color.hex.substring(1);
        const newForm = {
            ...formData,
            color: color.name, // Send Name explicitly to SOAP? Yes usually text color
            colorHex: color.hex
        };
        setFormData(newForm);
        onUpdate(newForm);
        setIsColorModalVisible(false);
    };

    const toggleInventoryItem = (valoracionId, descripcion) => {
        const currentStatus = formData.inventory?.[valoracionId]?.checked || false;

        const newInventory = {
            ...formData.inventory,
            [valoracionId]: {
                checked: !currentStatus,
                descripcion: descripcion
            }
        };

        const newForm = { ...formData, inventory: newInventory };
        setFormData(newForm);
        onUpdate(newForm);
    };

    const handleNext = () => {
        // Basic Validation
        if (!formData.tag || !formData.brand || !formData.model || !formData.year || !formData.color) {
            Alert.alert("Campos Requeridos", "Por favor complete los campos marcados con * (Placas, Marca, Modelo, Año, Color).");
            return;
        }

        if (onNext) {
            onNext(formData);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.sectionTitle}>Datos del Vehículo</Text>
            <View style={styles.soapSection}>
                {/* Placas & Marca */}
                <View style={styles.gridRow}>
                    <View style={[styles.inputGroup, { flex: 0.8 }]}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Placas *"
                            value={formData?.tag || ''}
                            onChangeText={(t) => handleChange('tag', t)}
                            autoCapitalize="characters"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <MaterialCommunityIcons name="tag-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Marca *"
                            value={formData?.brand || ''}
                            onChangeText={(t) => handleChange('brand', t)}
                            autoCapitalize="characters"
                        />
                    </View>
                </View>

                {/* Modelo & Año */}
                <View style={styles.gridRow}>
                    <View style={styles.inputGroup}>
                        <MaterialCommunityIcons name="car-side" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Modelo *"
                            value={formData?.model || ''}
                            onChangeText={(t) => handleChange('model', t)}
                            autoCapitalize="characters"
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 0.8 }]}>
                        <MaterialCommunityIcons name="calendar" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, formData?.isSoap && { backgroundColor: '#f0f0f0', color: '#666' }]}
                            placeholder="Año *"
                            value={formData?.year ? String(formData.year) : ''}
                            onChangeText={(t) => handleChange('year', t)}
                            keyboardType="numeric"
                            maxLength={4}
                            editable={!formData?.isSoap}
                        />
                    </View>
                </View>

                {/* Color, Serie, Motor */}
                <View style={styles.gridRow}>
                    <TouchableOpacity
                        style={styles.inputGroup}
                        onPress={() => setIsColorModalVisible(true)}
                    >
                        <MaterialCommunityIcons name="palette-outline" size={20} color="#666" style={styles.inputIcon} />
                        <Text
                            style={[styles.input, { textAlignVertical: 'center', lineHeight: Platform.OS === 'web' ? 42 : undefined }]}
                            numberOfLines={1}
                        >
                            {formData?.color || "Color *"}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <View style={styles.inputGroup}>
                        <MaterialCommunityIcons name="barcode-scan" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Serie / VIN"
                            value={formData?.chassis || ''}
                            onChangeText={(t) => handleChange('chassis', t)}
                            autoCapitalize="characters"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <MaterialCommunityIcons name="engine" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Motor"
                            value={formData?.motor || ''}
                            onChangeText={(t) => handleChange('motor', t)}
                            autoCapitalize="characters"
                        />
                    </View>
                </View>
            </View>

            {/* Internal Fields - Moved Here */}
            <View style={styles.divider} />

            <View style={styles.gridRow}>
                <View style={[styles.inputGroup, { width: '100%' }]}>
                    <MaterialCommunityIcons name="speedometer" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Kilometraje (K.M.)"
                        value={formData?.mileage || ''}
                        onChangeText={(t) => handleChange('mileage', t)}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={styles.gridRow}>
                <View style={[styles.inputGroup, { width: '100%', height: 100, alignItems: 'flex-start', paddingTop: 10 }]}>
                    <MaterialCommunityIcons name="comment-text-outline" size={20} color="#999" style={[styles.inputIcon, { marginTop: 4 }]} />
                    <TextInput
                        style={[styles.input, { textAlignVertical: 'top', height: '100%' }]}
                        placeholder="Observaciones"
                        value={formData?.observaciones || ''}
                        onChangeText={(t) => handleChange('observaciones', t)}
                        multiline={true}
                        numberOfLines={4}
                    />
                </View>
            </View>

            {/* Fuel Gauge - Enhanced Visual */}
            <View style={styles.visualSection}>
                <FuelGauge value={formData?.fuelLevel || 50} onChange={(v) => handleChange('fuelLevel', v)} />
            </View>

            {/* Inventory Checklist */}
            <View style={styles.inventoryContainer}>
                <Text style={styles.sectionTitle}>Inspección Vehicular (CHECKLIST)</Text>

                {loadingInspection ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#007bff" />
                        <Text style={{ marginTop: 10, color: '#666' }}>Cargando inspección...</Text>
                    </View>
                ) : (
                    inspectionData.map((tipo) => (
                        <View key={tipo.TipoValoracionID} style={styles.inventorySection}>
                            <Text style={styles.subSectionTitle}>{tipo.TipoValoracionValor}</Text>
                            <View style={styles.inventoryGrid}>
                                {tipo.Valoraciones.map((item) => (
                                    <TouchableOpacity
                                        key={item.ValoracionID}
                                        style={styles.inventoryItem}
                                        onPress={() => toggleInventoryItem(item.ValoracionID, item.ValoracionDescripcion)}
                                    >
                                        <View style={[
                                            styles.checkbox,
                                            formData.inventory?.[item.ValoracionID]?.checked && styles.checkboxActive
                                        ]}>
                                            {formData.inventory?.[item.ValoracionID]?.checked && (
                                                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                                            )}
                                        </View>
                                        <Text style={styles.inventoryLabel}>{item.ValoracionDescripcion}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.buttonContainer}>
                {submitting ? (
                    <Text style={{ textAlign: 'center', color: '#666', marginBottom: 10 }}>Registrando en servicio externo...</Text>
                ) : null}
                <TouchableOpacity style={[styles.nextButton, submitting && { opacity: 0.5 }]} onPress={handleNext} disabled={submitting}>
                    <Text style={styles.nextButtonText}>Siguiente</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Color Picker Modal */}
            <Modal
                visible={isColorModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsColorModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Color del Vehículo</Text>
                            <TouchableOpacity onPress={() => setIsColorModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={vehicleColors}
                            keyExtractor={(item) => item.name}
                            numColumns={4}
                            columnWrapperStyle={styles.colorGridRow}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.colorItem}
                                    onPress={() => handleSelectColor(item)}
                                >
                                    <View style={[styles.colorPreview, { backgroundColor: item.hex }]} />
                                    <Text style={styles.colorName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.colorHex}>{item.hex}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#fff'
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 10,
        marginLeft: 5,
        textTransform: 'uppercase'
    },
    soapSection: {
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e9ecef'
    },
    gridRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 5,
        gap: 10,
    },
    inputGroup: {
        flexGrow: 1,
        flexBasis: 160,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 50,
        marginBottom: 10,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        height: '100%',
    },
    picker: {
        flex: 1,
        backgroundColor: 'transparent',
        color: '#333',
        ...Platform.select({
            web: { outlineStyle: 'none' }
        })
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15,
    },
    visualSection: {
        marginBottom: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    gaugeWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    gaugeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    gaugeContainer: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        width: '100%',
    },
    label: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    gaugeSegment: {
        width: 45,
        height: 45,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22.5,
        borderWidth: 2,
        borderColor: '#e9ecef',
        elevation: 1,
    },
    gaugeText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    gaugeTextActive: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },

    buttonContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 10
    },
    nextButton: {
        backgroundColor: '#007bff',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: 500,
        borderRadius: 15,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    colorGridRow: {
        justifyContent: 'space-around',
    },
    colorItem: {
        width: '22%',
        alignItems: 'center',
        marginBottom: 15,
        padding: 5,
    },
    colorPreview: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 5,
    },
    colorName: {
        fontSize: 10,
        color: '#444',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    colorHex: {
        fontSize: 9,
        color: '#888',
        textAlign: 'center',
    },
    // Inventory Styles
    inventoryContainer: {
        marginTop: 10,
        marginBottom: 20,
    },
    inventorySection: {
        marginBottom: 15,
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    subSectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 8,
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 4
    },
    inventoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    inventoryItem: {
        width: '50%', // 2 columns
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingRight: 5,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#ccc',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    checkboxActive: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    inventoryLabel: {
        fontSize: 12,
        color: '#333',
        flex: 1,
    }
});

const vehicleColors = [
    { name: 'BLANCO', hex: '#FFFFFF' },
    { name: 'NEGRO', hex: '#000000' },
    { name: 'GRIS RATÓN', hex: '#4B4B4B' },
    { name: 'PLATA', hex: '#C0C0C0' },
    { name: 'GRIS OXFORD', hex: '#353839' },
    { name: 'VINCULACIÓN', hex: '#E5E4E2' },
    { name: 'ROJO', hex: '#FF0000' },
    { name: 'VINO', hex: '#722F37' },
    { name: 'AZUL', hex: '#0000FF' },
    { name: 'AZUL MARINO', hex: '#000080' },
    { name: 'VERDE', hex: '#008000' },
    { name: 'AMARILLO', hex: '#FFFF00' },
    { name: 'BEIGE', hex: '#F5F5DC' },
    { name: 'CAFÉ', hex: '#A52A2A' },
    { name: 'OTRO', hex: '#CCCCCC' }
];

export default VehicleDetailsScreen;
