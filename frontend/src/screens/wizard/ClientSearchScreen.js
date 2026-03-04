import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, FlatList, Platform, Keyboard } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { searchClients, createClient, syncClient } from '../../services/clients';
import { ActivityIndicator, Alert } from 'react-native';
import ClientCreateModal from './ClientCreateModal';

// CONSTANTS MOVED TO ClientCreateModal.js

const ClientSearchScreen = ({ data, onUpdate, onNext }) => {
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

    // Búsqueda con Debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 2) {
                setIsLoading(true);
                try {
                    console.log(`[ClientSearchScreen] Searching SOAP endpoint for: "${searchQuery}"`);
                    const results = await searchClients(searchQuery);
                    console.log(`[ClientSearchScreen] Raw results:`, results);

                    if (Array.isArray(results)) {
                        console.log(`[ClientSearchScreen] Found ${results.length} items (Array format)`);
                        setFilteredClients(results);
                    } else if (results && typeof results === 'object') {
                        console.log(`[ClientSearchScreen] Found 1 item (Object format)`);
                        setFilteredClients([results]);
                    } else {
                        console.log(`[ClientSearchScreen] Unrecognized format or empty array`);
                        setFilteredClients([]);
                    }
                } catch (error) {
                    console.error("[ClientSearchScreen] Search Error:", error);
                    if (error.response) {
                        console.error("[ClientSearchScreen] Error Details:", error.response.data);
                    }
                    setFilteredClients([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setFilteredClients([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setIsConfirmModalVisible(true);
    };

    const handleClientCreated = (newClient) => {
        setClients([...clients, newClient]);
        setIsModalVisible(false); // Close create modal
        setSelectedClient(newClient); // Select new client
        setIsConfirmModalVisible(true); // Open confirm modal
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Selección de Cliente</Text>

            <View style={styles.card}>
                {selectedClient ? (
                    <View style={styles.selectedClientContainer}>
                        <View style={styles.selectedClientHeader}>
                            <Text style={styles.selectedClientTitle}>Cliente Seleccionado</Text>
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
                        <View style={styles.clientCardContent}>
                            <View style={styles.clientIconContainer}>
                                <MaterialCommunityIcons name="account-check" size={40} color="#4CAF50" />
                            </View>
                            <View style={styles.clientDetails}>
                                <Text style={styles.clientName}>{selectedClient.nombre}</Text>
                                <Text style={styles.clientInfo}>{selectedClient.rfc}</Text>
                                <Text style={styles.clientInfo}>{selectedClient.telefono}</Text>
                                <Text style={styles.clientInfo}>{selectedClient.email}</Text>
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
                                    placeholder="Buscar cliente..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.compactAddButton}
                                onPress={() => setIsModalVisible(true)}
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
                                                <Text style={styles.resultName}>{item.nombre || 'Sin Nombre'}</Text>
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
                            <Text style={styles.modalTitle}>Confirmar Cliente</Text>
                            <TouchableOpacity onPress={() => setIsConfirmModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {selectedClient && (
                            <ScrollView style={styles.formContainer}>
                                <View style={styles.readOnlyContainer}>
                                    <View style={styles.inputRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.label}>RFC</Text>
                                            <Text style={styles.readOnlyText}>{selectedClient.rfc}</Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={styles.label}>Teléfono</Text>
                                            <Text style={styles.readOnlyText}>{selectedClient.telefono}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Nombre / Razón Social</Text>
                                        <Text style={styles.readOnlyText}>{selectedClient.nombre}</Text>
                                        {/* Fallback to razon_social if needed, though usually one or other implies name */}
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Domicilio</Text>
                                        <Text style={styles.readOnlyText}>{selectedClient.domicilio}</Text>
                                    </View>

                                    <View style={styles.inputRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.label}>Ciudad</Text>
                                            <Text style={styles.readOnlyText}>{selectedClient.ciudad}</Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={styles.label}>Estado</Text>
                                            <Text style={styles.readOnlyText}>{selectedClient.estado}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Correo Electrónico</Text>
                                        <Text style={styles.readOnlyText}>{selectedClient.email || 'N/A'}</Text>
                                    </View>
                                </View>
                            </ScrollView>
                        )}

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsConfirmModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, isLoading && { opacity: 0.7 }]}
                                disabled={isLoading}
                                onPress={async () => {
                                    setIsLoading(true);
                                    try {
                                        // Sync with external API (172.16...), receive ID
                                        const syncResponse = await syncClient(selectedClient);
                                        console.log("Client Sync Response:", syncResponse);

                                        if (syncResponse && syncResponse.success) {
                                            const updatedClient = {
                                                ...selectedClient,
                                                clienteidgen: syncResponse.clienteidgen || selectedClient.clienteidgen,
                                                // Ensure we keep existing data if API returns minimal
                                            };

                                            setIsConfirmModalVisible(false);
                                            onUpdate(updatedClient);
                                            onNext();
                                        } else {
                                            Alert.alert("Error", "No se pudo sincronizar el cliente. Intente nuevamente.");
                                        }
                                    } catch (err) {
                                        // Show actual error for debugging
                                        let errorMessage = err.message;
                                        if (err.response) {
                                            errorMessage = `Server Error: ${err.response.status}`;
                                            if (err.response.data && err.response.data.detail) {
                                                errorMessage += `\nDetalle: ${err.response.data.detail}`;
                                            }
                                        }

                                        Alert.alert("Error de Conexión", `Falló la validación: ${errorMessage}`);
                                        console.log("Sync Error", err);
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
    compactAddButton: {
        backgroundColor: '#4CAF50',
        width: 36,
        height: 36,
        borderRadius: 18,
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
