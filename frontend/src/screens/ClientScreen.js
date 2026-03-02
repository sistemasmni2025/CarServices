import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createClient, getClientById } from '../services/clients';
import { createVehicle, getUniqueCatalog } from '../services/vehicles';
import { Ionicons } from '@expo/vector-icons';

const ClientScreen = ({ navigation, route }) => {
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [clientId, setClientId] = useState(null);

    // Client Data
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        razon_social: '',
        rfc: '',
        regimen_fiscal: '601 - General de Ley Personas Morales',
        domicilio: '',
        cp: '',
        ciudad: '',
        estado: 'CIUDAD DE MEXICO',
        telefono: '',
        email: '',
        asesor: 'PATIO LOCAL',
        condiciones_pago: 'Contado',
        estado_catalogo: 'Activo',
        domicilio2: '',
        categoria: ''
    });

    // Vehicle Data
    const [vehicleData, setVehicleData] = useState({
        placas: '',
        marca: '',
        modelo: '',
        color: '',
        no_serie: '',
        anio: '',
        km: ''
    });

    const [existingVehicles, setExistingVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [addingVehicle, setAddingVehicle] = useState(false);

    // Catalog Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [catalog, setCatalog] = useState([]);
    const [filteredCatalog, setFilteredCatalog] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingCatalog, setLoadingCatalog] = useState(false);


    const fetchClientDetails = async (id) => {
        setLoadingVehicles(true);
        try {
            const client = await getClientById(id);
            if (client) {
                setFormData({
                    ...formData,
                    codigo: client.codigo || '',
                    nombre: client.nombre || '',
                    razon_social: client.razon_social || '',
                    rfc: client.rfc || '',
                    regimen_fiscal: client.regimen_fiscal || '601 - General de Ley Personas Morales',
                    domicilio: client.domicilio || '',
                    cp: client.cp || '',
                    ciudad: client.ciudad || '',
                    estado: client.estado || 'CIUDAD DE MEXICO',
                    telefono: client.telefono || '',
                    email: client.email || '',
                    condiciones_pago: client.condiciones_pago || 'Contado',
                    domicilio2: client.domicilio2 || '',
                    categoria: client.categoria || '',
                });
                setExistingVehicles(client.vehicles || []);
            }
        } catch (error) {
            console.log("Error fetching client details:", error);
            Alert.alert("Error", "No se pudieron cargar los detalles del cliente.");
        } finally {
            setLoadingVehicles(false);
        }
    };

    const fetchCatalog = async () => {
        setLoadingCatalog(true);
        try {
            const data = await getUniqueCatalog();
            setCatalog(data);
            setFilteredCatalog(data);
        } catch (error) {
            console.log("Error fetching catalog:", error);
        } finally {
            setLoadingCatalog(false);
        }
    };

    useEffect(() => {
        if (route.params && route.params.client) {
            const { client } = route.params;
            setIsReadOnly(true);
            setClientId(client.id);
            setFormData({
                ...formData,
                codigo: client.codigo || '',
                nombre: client.nombre || '',
                razon_social: client.razon_social || '',
                rfc: client.rfc || '',
                regimen_fiscal: client.regimen_fiscal || '601 - General de Ley Personas Morales',
                domicilio: client.domicilio || '',
                cp: client.cp || '',
                ciudad: client.ciudad || '',
                estado: client.estado || 'CIUDAD DE MEXICO',
                telefono: client.telefono || '',
                email: client.email || '',
                condiciones_pago: client.condiciones_pago || 'Contado',
            });

            if (client.id) {
                fetchClientDetails(client.id);
            }
        }
    }, [route.params]);

    // Search Logic for Catalog
    useEffect(() => {
        if (searchQuery) {
            const lowerComp = searchQuery.toLowerCase();
            const filtered = catalog.filter(v =>
                v.marca.toLowerCase().includes(lowerComp) ||
                v.modelo.toLowerCase().includes(lowerComp)
            );
            setFilteredCatalog(filtered);
        } else {
            setFilteredCatalog(catalog);
        }
    }, [searchQuery, catalog]);


    const handleClientChange = (name, value) => {
        if (isReadOnly) return;
        setFormData({ ...formData, [name]: value });
    };

    const handleVehicleChange = (name, value) => {
        setVehicleData({ ...vehicleData, [name]: value });
    };

    const openCatalog = () => {
        fetchCatalog();
        setModalVisible(true);
    };

    const selectFromCatalog = (item) => {
        setVehicleData({
            ...vehicleData,
            marca: item.marca,
            modelo: item.modelo,
            anio: item.anio ? item.anio.toString() : '',
        });
        setModalVisible(false);
        if (isReadOnly && !addingVehicle) {
            setAddingVehicle(true);
        }
    };

    const handleNewVehicleManual = () => {
        setModalVisible(false);
        setVehicleData({ placas: '', marca: '', modelo: '', color: '', no_serie: '', anio: '', km: '' });
        if (isReadOnly) setAddingVehicle(true);
    };


    const handleSubmitClient = async () => {
        if (!formData.codigo || !formData.nombre || !formData.rfc) {
            Alert.alert('Error', 'Código, Nombre y RFC del cliente son obligatorios');
            return;
        }

        const hasVehicleData = vehicleData.placas || vehicleData.marca || vehicleData.modelo;
        if (hasVehicleData && (!vehicleData.placas || !vehicleData.marca)) {
            Alert.alert('Error', 'Si registra un vehículo, Placas y Marca son requeridas');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                vehiculo: hasVehicleData ? { ...vehicleData, anio: parseInt(vehicleData.anio) || 2024, km: parseInt(vehicleData.km) || 0 } : null
            };

            await createClient(payload);
            Alert.alert('Éxito', 'Cliente y Vehículo registrados correctamente');
            navigation.goBack();
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'No se pudo registrar. Verifique los datos.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddVehicle = async () => {
        if (!vehicleData.placas || !vehicleData.marca) {
            Alert.alert('Error', 'Placas y Marca son requeridas');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...vehicleData,
                anio: parseInt(vehicleData.anio) || 2024,
                km: parseInt(vehicleData.km) || 0,
                cliente_id: clientId
            };
            await createVehicle(payload);
            Alert.alert('Éxito', 'Vehículo agregado correctamente');
            setVehicleData({ placas: '', marca: '', modelo: '', color: '', no_serie: '', anio: '', km: '' });
            setAddingVehicle(false);
            fetchClientDetails(clientId);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'No se pudo agregar el vehículo. Verifique si las placas ya existen.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = isReadOnly ? [styles.input, styles.readOnlyInput] : styles.input;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{isReadOnly ? 'Gestión de Cliente' : 'Alta Rápida de Cliente + Vehículo'}</Text>
            </View>
            <ScrollView contentContainerStyle={styles.form}>

                {/* --- CLIENT SECTION --- */}
                <Text style={styles.sectionTitle}>Datos del Cliente</Text>

                <Text style={styles.label}>Código</Text>
                <TextInput style={inputStyle} value={formData.codigo} onChangeText={(t) => handleClientChange('codigo', t)} placeholder="Ej. 39275" editable={!isReadOnly} />

                <Text style={styles.label}>Nombre</Text>
                <TextInput style={inputStyle} value={formData.nombre} onChangeText={(t) => handleClientChange('nombre', t)} editable={!isReadOnly} />

                <Text style={styles.label}>Razón Social</Text>
                <TextInput style={inputStyle} value={formData.razon_social} onChangeText={(t) => handleClientChange('razon_social', t)} editable={!isReadOnly} />

                <Text style={styles.label}>R.F.C.</Text>
                <TextInput style={inputStyle} value={formData.rfc} onChangeText={(t) => handleClientChange('rfc', t)} autoCapitalize="characters" editable={!isReadOnly} />

                <Text style={styles.label}>Régimen Fiscal</Text>
                <View style={[styles.pickerContainer, isReadOnly && styles.readOnlyInput]}>
                    <Picker selectedValue={formData.regimen_fiscal} onValueChange={(v) => handleClientChange('regimen_fiscal', v)} enabled={!isReadOnly}>
                        <Picker.Item label="601 - General de Ley Personas Morales" value="601 - General de Ley Personas Morales" />
                        <Picker.Item label="612 - Personas Físicas con Actividades" value="612 - Personas Físicas con Actividades" />
                        <Picker.Item label="626 - Régimen Simplificado de Confianza" value="626 - Régimen Simplificado de Confianza" />
                    </Picker>
                </View>

                <Text style={styles.label}>Categoría</Text>
                <TextInput style={inputStyle} value={formData.categoria} onChangeText={(t) => handleClientChange('categoria', t)} editable={!isReadOnly} />

                <Text style={styles.label}>Domicilio</Text>
                <TextInput style={inputStyle} value={formData.domicilio} onChangeText={(t) => handleClientChange('domicilio', t)} editable={!isReadOnly} placeholder="Calle y Número" />

                <Text style={styles.label}>Domicilio 2 (Colonia/Referencia)</Text>
                <TextInput style={inputStyle} value={formData.domicilio2} onChangeText={(t) => handleClientChange('domicilio2', t)} editable={!isReadOnly} />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>C.P.</Text>
                        <TextInput style={inputStyle} value={formData.cp} onChangeText={(t) => handleClientChange('cp', t)} keyboardType="numeric" editable={!isReadOnly} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Teléfono</Text>
                        <TextInput style={inputStyle} value={formData.telefono} onChangeText={(t) => handleClientChange('telefono', t)} keyboardType="phone-pad" editable={!isReadOnly} />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Ciudad</Text>
                        <TextInput style={inputStyle} value={formData.ciudad} onChangeText={(t) => handleClientChange('ciudad', t)} editable={!isReadOnly} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Estado</Text>
                        <TextInput style={inputStyle} value={formData.estado} onChangeText={(t) => handleClientChange('estado', t)} editable={!isReadOnly} />
                    </View>
                </View>

                <Text style={styles.label}>Email</Text>
                <TextInput style={inputStyle} value={formData.email} onChangeText={(t) => handleClientChange('email', t)} keyboardType="email-address" editable={!isReadOnly} />

                <Text style={styles.label}>Condiciones de Pago</Text>
                <View style={[styles.pickerContainer, isReadOnly && styles.readOnlyInput]}>
                    <Picker selectedValue={formData.condiciones_pago} onValueChange={(v) => handleClientChange('condiciones_pago', v)} enabled={!isReadOnly}>
                        <Picker.Item label="Contado" value="Contado" />
                        <Picker.Item label="Crédito 15 días" value="Credito 15 dias" />
                        <Picker.Item label="Crédito 30 días" value="Credito 30 dias" />
                    </Picker>
                </View>

                {/* --- VEHICLE SECTION --- */}
                <View style={styles.divider} />
                <View style={styles.row}>
                    <Text style={styles.sectionTitle}>Vehículos</Text>
                    {isReadOnly && !addingVehicle && (
                        <TouchableOpacity style={styles.addButtonSmall} onPress={openCatalog}>
                            <Text style={styles.addButtonTextSmall}>+ Agregar</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* New Client: Button to Select Vehicle from Catalog */}
                {!isReadOnly && !vehicleData.marca && (
                    <TouchableOpacity style={styles.catalogButton} onPress={openCatalog}>
                        <Text style={styles.catalogButtonText}>🔍 Buscar / Seleccionar Vehículo</Text>
                    </TouchableOpacity>
                )}

                {/* List of existing vehicles (Only in ReadOnly Mode) */}
                {isReadOnly && !addingVehicle && (
                    <View>
                        {loadingVehicles ? <ActivityIndicator /> : (
                            existingVehicles.length === 0 ? (
                                <Text style={styles.emptyText}>No hay vehículos registrados.</Text>
                            ) : (
                                existingVehicles.map((v, index) => (
                                    <View key={index} style={styles.vehicleItem}>
                                        <View style={styles.iconContainer}>
                                            <Text style={{ fontSize: 24 }}>🚗</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.vehicleTitle}>{v.marca} {v.modelo} ({v.anio})</Text>
                                            <Text style={styles.vehicleDetail}>Placas: {v.placas} | Color: {v.color}</Text>
                                        </View>
                                    </View>
                                ))
                            )
                        )}
                    </View>
                )}

                {/* Add Vehicle Form */}
                {(!isReadOnly || addingVehicle) && (vehicleData.marca || addingVehicle) && (
                    <View style={styles.vehicleForm}>
                        {isReadOnly && <Text style={styles.subTitle}>Datos del Vehículo</Text>}
                        {!isReadOnly && (
                            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 10 }} onPress={openCatalog}>
                                <Text style={{ color: '#2196F3' }}>Cambiar Selección</Text>
                            </TouchableOpacity>
                        )}
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.label}>Placas</Text>
                                <TextInput style={styles.input} value={vehicleData.placas} onChangeText={(text) => handleVehicleChange('placas', text)} placeholder="Ej. RNU-123" autoCapitalize="characters" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Marca</Text>
                                <TextInput style={styles.input} value={vehicleData.marca} onChangeText={(text) => handleVehicleChange('marca', text)} placeholder="Ej. Toyota" />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.label}>Modelo</Text>
                                <TextInput style={styles.input} value={vehicleData.modelo} onChangeText={(text) => handleVehicleChange('modelo', text)} placeholder="Ej. Hilux" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Año</Text>
                                <TextInput style={styles.input} value={vehicleData.anio} onChangeText={(text) => handleVehicleChange('anio', text)} keyboardType="numeric" placeholder="2024" />
                            </View>
                        </View>
                        <Text style={styles.label}>Color</Text>
                        <TextInput style={styles.input} value={vehicleData.color} onChangeText={(text) => handleVehicleChange('color', text)} />

                        {isReadOnly ? (
                            <View style={styles.row}>
                                <TouchableOpacity style={[styles.saveButton, { flex: 1, marginRight: 10 }]} onPress={handleAddVehicle} disabled={loading}>
                                    <Text style={styles.saveButtonText}>{loading ? 'Guardando...' : 'Guardar Vehículo'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.cancelButton, { flex: 1 }]} onPress={() => { setAddingVehicle(false); setVehicleData({ placas: '', marca: '', modelo: '', color: '', no_serie: '', anio: '', km: '' }); }}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                )}

                {!isReadOnly && (
                    <TouchableOpacity style={styles.saveButton} onPress={handleSubmitClient} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar Cliente y Vehículo</Text>}
                    </TouchableOpacity>
                )}

                {isReadOnly && !addingVehicle && (
                    <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.saveButtonText}>Cerrar</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>

            {/* CATALOG MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar de Catálogo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Buscar (ej. Nissan, Versa...)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {loadingCatalog ? <ActivityIndicator size="large" color="#007bff" /> : (
                            <FlatList
                                data={filteredCatalog}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.catalogItem} onPress={() => selectFromCatalog(item)}>
                                        {item.imagen ? (
                                            <Image
                                                source={{ uri: item.imagen }}
                                                style={styles.catalogImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Text style={{ fontSize: 24, marginRight: 15 }}>🚙</Text>
                                        )}
                                        <View>
                                            <Text style={styles.catalogItemTitle}>{item.marca} {item.modelo}</Text>
                                            <Text style={styles.catalogItemSubtitle}>{item.anio}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={() => (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ color: '#666' }}>No encontrado en catálogo.</Text>
                                        <TouchableOpacity style={styles.manualButton} onPress={handleNewVehicleManual}>
                                            <Text style={styles.manualButtonText}>Registrar Manualmente</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        )}
                        <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeModalButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#2a2a2a',
        padding: 15,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    form: {
        padding: 20,
        paddingBottom: 50,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007bff',
        marginTop: 10,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
        flex: 1
    },
    divider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 20,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
    },
    readOnlyInput: {
        backgroundColor: '#e9ecef',
        color: '#666',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    closeButton: {
        backgroundColor: '#757575',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    cancelButton: {
        backgroundColor: '#f44336',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    infoBox: {
        padding: 15,
        backgroundColor: '#fff3cd',
        borderRadius: 5,
        marginBottom: 20
    },
    addButtonSmall: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addButtonTextSmall: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12
    },
    vehicleItem: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center'
    },
    iconContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        borderRadius: 25,
        marginRight: 15
    },
    vehicleTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 5
    },
    vehicleDetail: {
        color: '#666'
    },
    emptyText: {
        fontStyle: 'italic',
        color: '#999',
        textAlign: 'center',
        marginVertical: 10
    },
    vehicleForm: {
        backgroundColor: '#fafafa',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginTop: 10
    },
    subTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333'
    },
    catalogButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#007bff',
        borderStyle: 'dashed',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20
    },
    catalogButtonText: {
        color: '#007bff',
        fontWeight: 'bold',
        fontSize: 16
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        maxHeight: '80%'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center'
    },
    catalogItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    catalogItemTitle: {
        fontWeight: 'bold',
        fontSize: 16
    },
    catalogItemSubtitle: {
        color: '#666'
    },
    manualButton: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#2196F3',
        borderRadius: 5
    },
    manualButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    closeModalButton: {
        marginTop: 15,
        padding: 10,
        alignItems: 'center'
    },
    closeModalButtonText: {
        color: '#666',
        fontSize: 16
    },
    catalogImage: {
        width: 100,
        height: 60,
        marginRight: 15,
        borderRadius: 5,
        backgroundColor: '#eee'
    }
});

export default ClientScreen;
