import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createClient } from '../../services/clients';

const REGIMENES_FISCALES = [
    { label: 'Selecciona', value: '' },
    { label: '601 - General de Ley Personas Morales', value: '601' },
    { label: '603 - Personas Morales con Fines no Lucrativos', value: '603' },
    { label: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios', value: '605' },
    { label: '606 - Arrendamiento', value: '606' },
    { label: '607 - Régimen de Enajenación o Adquisición de Bienes', value: '607' },
    { label: '608 - Demás ingresos', value: '608' },
    { label: '609 - Consolidación', value: '609' },
    { label: '610 - Residentes en el Extranjero sin Establecimiento Permanente en México', value: '610' },
    { label: '611 - Ingresos por Dividendos (socios y accionistas)', value: '611' },
    { label: '612 - Personas Físicas con Actividades Empresariales y Profesionales', value: '612' },
    { label: '614 - Ingresos por intereses', value: '614' },
    { label: '615 - Régimen de los ingresos por obtención de premios', value: '615' },
    { label: '616 - Sin obligaciones fiscales', value: '616' },
    { label: '621 - Incorporación Fiscal', value: '621' },
    { label: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', value: '622' },
    { label: '623 - Opcional para Grupos de Sociedades', value: '623' },
    { label: '624 - Coordinados', value: '624' },
    { label: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', value: '625' },
    { label: '626 - Régimen Simplificado de Confianza', value: '626' },
    { label: '628 - Hidrocarburos', value: '628' },
    { label: '629 - De los Regímenes Fiscales Preferentes y de las Empresas Multinacionales', value: '629' },
    { label: '630 - Enajenación de acciones en bolsa de valores', value: '630' },
];

const ESTADOS = [
    { label: 'Selecciona', value: '' },
    { label: 'Aguascalientes', value: 'Aguascalientes' },
    { label: 'Baja California', value: 'Baja California' },
    { label: 'Baja California Sur', value: 'Baja California Sur' },
    { label: 'Campeche', value: 'Campeche' },
    { label: 'Chiapas', value: 'Chiapas' },
    { label: 'Chihuahua', value: 'Chihuahua' },
    { label: 'Ciudad de México', value: 'Ciudad de México' },
    { label: 'Coahuila', value: 'Coahuila' },
    { label: 'Colima', value: 'Colima' },
    { label: 'Durango', value: 'Durango' },
    { label: 'Estado de México', value: 'Estado de México' },
    { label: 'Guanajuato', value: 'Guanajuato' },
    { label: 'Guerrero', value: 'Guerrero' },
    { label: 'Hidalgo', value: 'Hidalgo' },
    { label: 'Jalisco', value: 'Jalisco' },
    { label: 'Michoacán', value: 'Michoacán' },
    { label: 'Morelos', value: 'Morelos' },
    { label: 'Nayarit', value: 'Nayarit' },
    { label: 'Nuevo León', value: 'Nuevo León' },
    { label: 'Oaxaca', value: 'Oaxaca' },
    { label: 'Puebla', value: 'Puebla' },
    { label: 'Querétaro', value: 'Querétaro' },
    { label: 'Quintana Roo', value: 'Quintana Roo' },
    { label: 'San Luis Potosí', value: 'San Luis Potosí' },
    { label: 'Sinaloa', value: 'Sinaloa' },
    { label: 'Sonora', value: 'Sonora' },
    { label: 'Tabasco', value: 'Tabasco' },
    { label: 'Tamaulipas', value: 'Tamaulipas' },
    { label: 'Tlaxcala', value: 'Tlaxcala' },
    { label: 'Veracruz', value: 'Veracruz' },
    { label: 'Yucatán', value: 'Yucatán' },
    { label: 'Zacatecas', value: 'Zacatecas' },
];

const ClientCreateModal = ({ visible, onClose, onClientCreated }) => {
    /**
     * Modal de Alta Rápida de Clientes.
     * Permite registrar un nuevo cliente con los datos mínimos necesarios (Nombre, RFC).
     * Sincroniza con el backend tras la creación.
     */
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        rfc: '',
        razon_social: '',
        regimen_fiscal: '',
        domicilio: '',
        domicilio2: '',
        cp: '',
        ciudad: '',
        estado: '',
        telefono: '',
        asesor: '',
        email: '',
        condiciones_pago: '',
        estado_catalogo: '',
    });

    const handleSaveClient = async () => {
        if (!formData.nombre || !formData.rfc) {
            Alert.alert("Error", "Por favor ingresa al menos Nombre y RFC.");
            return;
        }

        setIsLoading(true);
        try {
            const newClient = await createClient(formData);
            const clientWithPlacas = { ...newClient, placas: '' };
            onClientCreated(clientWithPlacas);

            // Reset form
            setFormData({
                nombre: '', rfc: '', razon_social: '', regimen_fiscal: '',
                domicilio: '', domicilio2: '', cp: '', ciudad: '', estado: '', telefono: '',
                asesor: '', email: '', condiciones_pago: '', estado_catalogo: '',
            });
            onClose();

        } catch (error) {
            console.error("Error creating client:", error);
            Alert.alert("Error", "No se pudo crear el cliente.");
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
                        <Text style={styles.modalTitle}>Alta Rápida de Clientes</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.formContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Nombre</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={formData.nombre}
                                    onChangeText={(val) => setFormData({ ...formData, nombre: val })}
                                    autoCorrect={false}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>RFC</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={formData.rfc}
                                onChangeText={(val) => setFormData({ ...formData, rfc: val })}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                returnKeyType="next"
                                maxLength={13}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Razón Social</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={formData.razon_social}
                                onChangeText={(val) => setFormData({ ...formData, razon_social: val })}
                                autoCorrect={false}
                            />
                        </View>

                        <View style={[styles.inputGroup, { zIndex: 2000 }]}>
                            <Text style={styles.label}>Régimen Fiscal</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.regimen_fiscal}
                                    onValueChange={(val) => setFormData({ ...formData, regimen_fiscal: val })}
                                    style={styles.picker}
                                    mode="dialog"
                                >
                                    {REGIMENES_FISCALES.map((regimen) => (
                                        <Picker.Item key={regimen.value} label={regimen.label} value={regimen.value} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Domicilio</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 60 }]}
                                multiline
                                value={formData.domicilio}
                                onChangeText={(val) => setFormData({ ...formData, domicilio: val })}
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Domicilio 2 (Colonia/Referencia)</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={formData.domicilio2}
                                onChangeText={(val) => setFormData({ ...formData, domicilio2: val })}
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>C.P.</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={formData.cp}
                                    onChangeText={(val) => setFormData({ ...formData, cp: val })}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 2, marginLeft: 10 }]}>
                                <Text style={styles.label}>Teléfono</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={formData.telefono}
                                    onChangeText={(val) => setFormData({ ...formData, telefono: val })}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Ciudad</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={formData.ciudad}
                                    onChangeText={(val) => setFormData({ ...formData, ciudad: val })}
                                    autoCorrect={false}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                                <Text style={styles.label}>Estado</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={formData.estado}
                                        onValueChange={(val) => setFormData({ ...formData, estado: val })}
                                        style={styles.picker}
                                        mode="dialog"
                                    >
                                        {ESTADOS.map((estado) => (
                                            <Picker.Item key={estado.value} label={estado.label} value={estado.value} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={formData.email || ''}
                                onChangeText={(val) => setFormData({ ...formData, email: val })}
                                autoCorrect={false}
                                autoCapitalize="none"
                                returnKeyType="done"
                                onSubmitEditing={Keyboard.dismiss}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, isLoading && { backgroundColor: '#ccc' }]}
                            onPress={handleSaveClient}
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
    pickerContainer: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        justifyContent: 'center',
        paddingVertical: 2,
    },
    picker: {
        height: 55,
        width: '100%',
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

export default ClientCreateModal;
