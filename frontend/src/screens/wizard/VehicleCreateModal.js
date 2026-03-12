import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createVehicle } from '../../services/vehicles';

const VehicleCreateModal = ({ visible, onClose, onVehicleCreated, client }) => {
    /**
     * Modal de Alta Rápida de Vehículos.
     * Permite registrar un nuevo vehículo con los datos necesarios (Placas, Marca, Modelo, etc.).
     * Sincroniza con el backend tras la creación.
     */
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        tag: '',
        brand: '',
        model: '',
        year: '',
        color: '',
        chassis: '',
        motor: ''
    });

    const handleSaveVehicle = async () => {
        if (!formData.tag || !formData.brand || !formData.model) {
            Alert.alert("Error", "Por favor ingresa al menos Placas, Marca y Modelo.");
            return;
        }

        setIsLoading(true);
        try {
            // Mapeo exacto basado en la misma lógica que alta rápida de clientes
            const payloadPostman = {
                VehiculoPlacas: formData.tag.trim().toUpperCase(),
                VehiculoMarca: formData.brand.trim(),
                VehiculoModelo: formData.model.trim(),
                VehiculoAnio: formData.year.trim() ? parseInt(formData.year.trim(), 10) : 0,
                VehiculoColor: formData.color.trim(),
                VehiculoNumSerie: formData.chassis.trim().toUpperCase(),
                VehiculoMotor: formData.motor.trim().toUpperCase(),
                ClienteID: client?.id || 0,
                ClienteIDGen: client?.clienteidgen ? String(client.clienteidgen) : "0"
            };

            // console.log("[VehicleCreateModal] Payload a enviar:", payloadPostman);
            const responseBackend = await createVehicle(payloadPostman);
            // console.log("[VehicleCreateModal] Respuesta de creacion:", responseBackend);
            
            // Construimos el objeto vehículo como lo espera el flujo del Wizard (VehicleWorkflowScreen.js)
            const newVehicleUI = {
                id: responseBackend?.VehiculoID || responseBackend?.id || null,
                placas: payloadPostman.VehiculoPlacas,
                marca: payloadPostman.VehiculoMarca,
                modelo: payloadPostman.VehiculoModelo,
                anio: payloadPostman.VehiculoAnio,
                color: payloadPostman.VehiculoColor,
                serie: payloadPostman.VehiculoNumSerie,
                motor: formData.motor.trim().toUpperCase() // Not in Postman screenshot, but kept for UI
            };

            onVehicleCreated(newVehicleUI);

            // Reset form
            setFormData({
                tag: '', brand: '', model: '', year: '', color: '', chassis: '', motor: ''
            });
            onClose();

        } catch (error) {
            // console.error("Error creating vehicle:", error);
            if (error.response) {
                // console.error("Backend validation details:", error.response.data);
            }
            Alert.alert("Error", "No se pudo crear el vehículo. Verifica que las placas no estén duplicadas o que los datos sean correctos.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Alta Rápida de Vehículos</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.formContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Placas *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={formData.tag}
                                onChangeText={(val) => setFormData({ ...formData, tag: val })}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                returnKeyType="next"
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Marca *</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={formData.brand}
                                    onChangeText={(val) => setFormData({ ...formData, brand: val })}
                                    autoCorrect={false}
                                    autoCapitalize="words"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                                <Text style={styles.label}>Modelo *</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={formData.model}
                                    onChangeText={(val) => setFormData({ ...formData, model: val })}
                                    autoCorrect={false}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Año</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={formData.year}
                                    onChangeText={(val) => setFormData({ ...formData, year: val })}
                                    keyboardType="numeric"
                                    maxLength={4}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                                <Text style={styles.label}>Color</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={formData.color}
                                    onChangeText={(val) => setFormData({ ...formData, color: val })}
                                    autoCorrect={false}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Serie / VIN</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={formData.chassis}
                                onChangeText={(val) => setFormData({ ...formData, chassis: val })}
                                autoCapitalize="characters"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Motor</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={formData.motor}
                                onChangeText={(val) => setFormData({ ...formData, motor: val })}
                                autoCapitalize="characters"
                                autoCorrect={false}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, isLoading && { backgroundColor: '#ccc' }]}
                            onPress={handleSaveVehicle}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Confirmar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    formContainer: {
        marginBottom: 15,
    },
    inputGroup: {
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    label: {
        fontSize: 11,
        color: '#666',
        marginBottom: 4,
        fontWeight: '600',
    },
    modalInput: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 8,
        fontSize: 13,
        color: '#333',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 12,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 18,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default VehicleCreateModal;
