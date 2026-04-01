import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, FlatList, Platform, Keyboard, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { searchClients, createClient, syncClient, updateClient } from '../../services/clients';
import ClientCreateModal from './ClientCreateModal';
import { AuthContext } from '../../context/AuthContext';
import { useContext } from 'react';
import { showAlert, showError } from '../../utils/uiAlerts';

// CONSTANTS MOVED TO ClientCreateModal.js

const ClientSearchScreen = ({ data, onUpdate, onNext }) => {
    const { selectedBranch } = useContext(AuthContext);
    /**
     * Paso 2 del Wizard: Búsqueda y Selección de Cliente.
     * Permite buscar clientes existentes o crear nuevos (modales).
     * Sincroniza la selección con el backend.
     */
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Add Loading State
    const [selectedClient, setSelectedClient] = useState(data);
    const [clients, setClients] = useState([
        { id: '1', nombre: 'JUAN PEREZ', rfc: 'XAXX010101000', razon_social: 'JUAN PEREZ S.A.', regimen_fiscal: '612', domicilio: 'AV. CENTRAL 123', cp: '06500', ciudad: 'CDMX', estado: 'CDMX', telefono: '5551234567', email: 'juan@example.com', placas: 'ABC-123' },
        { id: '2', nombre: 'TRANSPORTES NIETO', rfc: 'TNI123456789', razon_social: 'MULTILLANTAS NIETO S.A.', regimen_fiscal: '601', domicilio: 'RIO LERMA 256', cp: '06700', ciudad: 'CDMX', estado: 'CDMX', telefono: '5559876543', email: 'contacto@nieto.com', placas: 'XYZ-789' },
    ]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [editableClient, setEditableClient] = useState(null);
    const [isEditing, setIsEditing] = useState(false);


    // Modal Form State - Updated keys to snake_case to match Backend Schema
    // Modal State moved to ClientCreateModal
    // ... existing search state ...

    // ... existing state ...

    // Sync state with props when navigating back
    useEffect(() => {
        if (data) {
            setSelectedClient(data);
        }
    }, [data]);

    // Búsqueda Manual
    const handleSearch = async () => {
        Keyboard.dismiss();
        if (searchQuery.trim().length > 2) {
            setIsLoading(true);
            try {
                const dns = selectedBranch?.dns || "";
                const results = await searchClients(searchQuery, dns);
                if (Array.isArray(results)) {
                    setFilteredClients(results);
                } else if (results && typeof results === 'object') {
                    setFilteredClients([results]);
                } else {
                    setFilteredClients([]);
                }
            } catch (error) {
                setFilteredClients([]);
            } finally {
                setIsLoading(false);
            }
        } else {
            setFilteredClients([]);
            if (searchQuery.trim().length > 0) {
                showAlert("Aviso", "Por favor ingrese al menos 3 caracteres para efectuar la búsqueda.");
            }
        }
    };

    const handleSelectClient = (client) => {
        Keyboard.dismiss();
        setSelectedClient(client);
        setEditableClient({ ...client }); // Initialize editable state
        setIsEditing(false); // Default to read-only confirmation
        // Deferred to prevent "Blocked aria-hidden" React Native Web bug
        setTimeout(() => setIsConfirmModalVisible(true), 50);
    };

    const handleClientCreated = (newClient) => {
        Keyboard.dismiss();
        setClients([...clients, newClient]);
        setIsModalVisible(false); // Close create modal
        setSelectedClient(newClient); // Select new client
        setEditableClient({ ...newClient }); // Initialize editable state
        setIsEditing(false); // Default to read-only confirmation
        setTimeout(() => setIsConfirmModalVisible(true), 50); // Open confirm modal safely
    };

    const openCreateModal = () => {
        Keyboard.dismiss();
        setTimeout(() => setIsModalVisible(true), 50);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Selección de Cliente</Text>

            <View style={styles.card}>
                {selectedClient ? (
                    <View style={styles.selectedClientContainer}>
                        <View style={styles.selectedClientHeader}>
                            <Text style={styles.selectedClientTitle}>Cliente Seleccionado</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <TouchableOpacity
                                    style={styles.editButtonSmall}
                                    onPress={() => {
                                        setEditableClient({ ...selectedClient });
                                        setIsEditing(true);
                                        setTimeout(() => setIsConfirmModalVisible(true), 50);
                                    }}
                                >
                                    <MaterialCommunityIcons name="pencil" size={16} color="#007bff" />
                                    <Text style={styles.editButtonTextSmall}>Editar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deselectButton}
                                    onPress={() => {
                                        setSelectedClient(null);
                                        onUpdate(null);
                                    }}
                                >
                                    <MaterialCommunityIcons name="close" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.clientCardContent}>
                            <View style={styles.clientIconContainer}>
                                <MaterialCommunityIcons name="account-check" size={40} color="#4CAF50" />
                            </View>
                            <View style={styles.clientDetails}>
                                <Text style={styles.clientName}>{selectedClient.id ? `${selectedClient.id} - ` : ''}{selectedClient.nombre}</Text>
                                <View style={styles.clientInfoRow}>
                                    <Text style={styles.clientInfo}><MaterialCommunityIcons name="card-account-details-outline" size={14} /> {selectedClient.rfc}</Text>
                                    <Text style={[styles.clientInfo, { marginLeft: 15 }]}><MaterialCommunityIcons name="phone" size={14} /> {selectedClient.telefono || 'N/A'}</Text>
                                </View>
                                <Text style={styles.clientInfo}><MaterialCommunityIcons name="email-outline" size={14} /> {selectedClient.email || 'N/A'}</Text>
                                <Text style={styles.clientInfo}><MaterialCommunityIcons name="map-marker-outline" size={14} /> {selectedClient.domicilio}{selectedClient.domicilio2 ? ` (${selectedClient.domicilio2})` : ''}</Text>
                                <Text style={styles.clientInfo}><MaterialCommunityIcons name="city" size={14} /> {selectedClient.ciudad}, {selectedClient.estado} {selectedClient.cp ? `CP: ${selectedClient.cp}` : ''}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.changeClientButton}
                            onPress={() => {
                                setSelectedClient(null);
                                onUpdate(null);
                            }}
                        >
                            <Text style={styles.changeClientText}>Cambiar Cliente</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.searchRow}>
                            <View style={styles.searchContainer}>
                                <MaterialCommunityIcons name="account-search" size={20} color="#666" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Buscar por placa, nombre o clave..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={handleSearch}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.searchButton}
                                onPress={handleSearch}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.compactAddButton}
                                onPress={openCreateModal}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {searchQuery.length > 0 ? (
                            <View style={styles.resultsContainer}>
                                <FlatList
                                    data={filteredClients}
                                    keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                                    initialNumToRender={10}
                                    maxToRenderPerBatch={10}
                                    windowSize={5}
                                    removeClippedSubviews={true}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectClient(item)}>
                                            <View>
                                                <Text style={styles.resultName}>{item.id ? `${item.id} - ` : ''}{item.nombre || 'Sin Nombre'}</Text>
                                                <Text style={styles.resultSub}>{item.rfc || 'Sin RFC'} {item.placas ? `• ${item.placas}` : ''}</Text>
                                            </View>
                                            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <Text style={styles.emptyText}>No se encontraron resultados</Text>
                                    }
                                />
                            </View>
                        ) : (
                            <View style={styles.placeholderResults}>
                                <Text style={{ color: '#999', fontStyle: 'italic', fontSize: 12 }}>Escriba para buscar por nombre o placa...</Text>
                            </View>
                        )}
                    </>
                )}
            </View>

            {/* Alta Rápida Modal */}
            <ClientCreateModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onClientCreated={handleClientCreated}
            />

            {/* Confirmation Modal (Read-Only) */}
            <Modal
                visible={isConfirmModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsConfirmModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Confirmar Cliente</Text>
                                <Text style={{ fontSize: 10, color: isEditing ? '#007bff' : '#666' }}>{isEditing ? 'Modo Edición Activado' : 'Solo Lectura'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsConfirmModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {editableClient && (
                            <ScrollView style={styles.formContainer}>
                                <View style={styles.readOnlyContainer}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>RFC</Text>
                                        <TextInput
                                            style={[styles.modalInput, styles.disabledInput]}
                                            value={editableClient.rfc}
                                            editable={false}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Teléfono</Text>
                                        <TextInput
                                            style={[styles.modalInput, !isEditing && styles.disabledInput]}
                                            value={editableClient.telefono}
                                            onChangeText={(val) => setEditableClient({ ...editableClient, telefono: val })}
                                            keyboardType="phone-pad"
                                            editable={isEditing}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Nombre / Razón Social</Text>
                                        <TextInput
                                            style={[styles.modalInput, styles.disabledInput]}
                                            value={editableClient.nombre}
                                            editable={false}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Domicilio</Text>
                                        <TextInput
                                            style={[styles.modalInput, !isEditing && styles.disabledInput]}
                                            value={editableClient.domicilio}
                                            onChangeText={(val) => setEditableClient({ ...editableClient, domicilio: val })}
                                            editable={isEditing}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Domicilio 2 (Colonia/Referencia)</Text>
                                        <TextInput
                                            style={[styles.modalInput, !isEditing && styles.disabledInput]}
                                            value={editableClient.domicilio2}
                                            onChangeText={(val) => setEditableClient({ ...editableClient, domicilio2: val })}
                                            editable={isEditing}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>C.P.</Text>
                                        <TextInput
                                            style={[styles.modalInput, !isEditing && styles.disabledInput]}
                                            value={editableClient.cp}
                                            onChangeText={(val) => setEditableClient({ ...editableClient, cp: val })}
                                            keyboardType="numeric"
                                            editable={isEditing}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Ciudad</Text>
                                        <TextInput
                                            style={[styles.modalInput, !isEditing && styles.disabledInput]}
                                            value={editableClient.ciudad}
                                            onChangeText={(val) => setEditableClient({ ...editableClient, ciudad: val })}
                                            editable={isEditing}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Estado</Text>
                                        <TextInput
                                            style={[styles.modalInput, !isEditing && styles.disabledInput]}
                                            value={editableClient.estado}
                                            onChangeText={(val) => setEditableClient({ ...editableClient, estado: val })}
                                            editable={isEditing}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Correo Electrónico</Text>
                                        <TextInput
                                            style={[styles.modalInput, !isEditing && styles.disabledInput]}
                                            value={editableClient.email}
                                            onChangeText={(val) => setEditableClient({ ...editableClient, email: val })}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            editable={isEditing}
                                        />
                                    </View>
                                </View>
                            </ScrollView>
                        )}

                        <View style={styles.modalFooter}>
                            {isEditing ? (
                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: '#007bff', marginRight: 'auto' }, isLoading && { opacity: 0.7 }]}
                                    disabled={isLoading}
                                    onPress={async () => {
                                        setIsLoading(true);
                                        try {
                                            const syncResponse = await syncClient(editableClient, selectedBranch?.dns);
                                            // Si llegamos aquí es porque no hubo error lanzado por el servicio
                                            const finalClientData = { 
                                                ...editableClient, 
                                                clienteidgen: syncResponse.clienteidgen || editableClient.clienteidgen,
                                                localId: syncResponse.localId || editableClient.localId 
                                            };
                                            setEditableClient(finalClientData);
                                            setSelectedClient(finalClientData);
                                            onUpdate(finalClientData);
                                            
                                            // Back to read-only view, wait for manual Confirmar Selección
                                            setIsEditing(false);
                                        } catch (err) {
                                            showError("Error del Sistema", err);
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                >
                                    <Text style={styles.saveButtonText}>Actualizar Datos</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setIsEditing(true)}
                                    style={[styles.editBadge, { marginRight: 'auto' }]}
                                >
                                    <MaterialCommunityIcons name="pencil" size={20} color="#007bff" />
                                    <Text style={styles.editBadgeText}>Editar Datos</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsConfirmModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>{isEditing ? 'Cancelar' : 'Cerrar'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveButton, isLoading && { opacity: 0.7 }]}
                                disabled={isLoading}
                                onPress={async () => {
                                    setIsLoading(true);
                                    try {
                                        const syncResponse = await syncClient(editableClient, selectedBranch?.dns);
                                        
                                        const updatedClient = {
                                            ...editableClient,
                                            clienteidgen: syncResponse.clienteidgen || editableClient.clienteidgen,
                                            localId: syncResponse.localId || editableClient.localId,
                                        };

                                        setIsConfirmModalVisible(false);
                                        onUpdate(updatedClient);
                                        onNext();
                                    } catch (err) {
                                        showError("Error de Confirmación", err);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Confirmar Selección</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={{ flex: 1 }} />

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.nextButton, !selectedClient && { backgroundColor: '#ccc' }]}
                    disabled={!selectedClient}
                    onPress={() => {
                        onUpdate(selectedClient);
                        onNext();
                    }}
                >
                    <Text style={styles.nextButtonText}>Siguiente</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f5f7fa',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 5,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 13,
        color: '#333',
    },
    searchButton: {
        backgroundColor: '#007bff',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    compactAddButton: {
        backgroundColor: '#4CAF50',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    placeholderResults: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultsContainer: {
        maxHeight: 400, // Aumentado para mostrar ms resultados como pidi el usuario
        marginTop: 5,
    },
    resultItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16, // Aumentado para mejor visualizacin
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    resultName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
    },
    resultSub: {
        fontSize: 11,
        color: '#777',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        paddingVertical: 15,
        fontSize: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
    },
    nextButton: {
        backgroundColor: '#007bff',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 20,
        elevation: 2,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 6,
    },
    // Modal Styles
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
        paddingVertical: 2, // Added vertical padding to container
    },
    picker: {
        height: 55,
        width: '100%',
        color: '#333',
        // Removed background color and padding to reduce render complexity
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
    readOnlyContainer: {
        paddingVertical: 5,
    },
    readOnlyText: {
        fontSize: 14,
        color: '#333',
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        fontWeight: '500',
    },
    readOnlyText: {
        fontSize: 14,
        color: '#333',
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        fontWeight: '500',
    },
    disabledInput: {
        backgroundColor: '#f0f0f0',
        color: '#888',
        borderColor: '#e0e0e0',
    },
    editBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f7ff',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#007bff',
        gap: 5,
    },
    editBadgeActive: {
        backgroundColor: '#007bff',
    },
    editBadgeText: {
        fontSize: 12,
        color: '#007bff',
        fontWeight: 'bold',
    },
    editButtonSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        backgroundColor: '#f0f7ff',
        borderWidth: 1,
        borderColor: '#007bff',
    },
    editButtonTextSmall: {
        fontSize: 11,
        color: '#007bff',
        fontWeight: '600',
    },
    // Selected Client Styles
    selectedClientContainer: {
        padding: 10,
    },
    selectedClientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    selectedClientTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    deselectButton: {
        padding: 5,
    },
    clientCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    clientIconContainer: {
        marginRight: 15,
        backgroundColor: '#e8f5e9',
        padding: 10,
        borderRadius: 25,
    },
    clientDetails: {
        flex: 1,
    },
    clientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    clientInfo: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    clientInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    changeClientButton: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    changeClientText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 13,
    },
});

export default ClientSearchScreen;
