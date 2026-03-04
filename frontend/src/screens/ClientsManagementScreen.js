import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getClients, searchClients } from '../services/clients';

const ClientsManagementScreen = ({ navigation }) => {
    const [search, setSearch] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Eliminamos la carga inicial de todos los clientes porque
    // el nuevo endpoint SOAP requiere una búsqueda obligatoria.

    const handleSearch = async (text) => {
        setSearch(text);

        if (!text || text.trim() === '') {
            setFilteredClients([]);
            setIsSearching(false);
            return;
        }

        // Búsqueda dinámica con el nuevo endpoint
        setIsSearching(true);
        setLoading(true);
        try {
            console.log(`[ClientsManagement] Searching for: ${text}`);
            const data = await searchClients(text);
            console.log(`[ClientsManagement] Search returned ${data ? data.length : 0} items`);

            // Verificamos si la respuesta es un arreglo (formato esperado)
            if (Array.isArray(data)) {
                setFilteredClients(data);
            } else if (data && typeof data === 'object') {
                // Manejo de fallback si el backend envuelve la respuesta
                setFilteredClients([data]);
            } else {
                setFilteredClients([]);
            }
        } catch (error) {
            console.error("Error buscando clientes:", error);
            setFilteredClients([]);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.clientItem}
            onPress={() => navigation.navigate('ClientData', { client: item })}
        >
            <View>
                <Text style={styles.clientName}>{item.nombre}</Text>
                <Text style={styles.clientCode}>Código: {item.codigo} | RFC: {item.rfc}</Text>
            </View>
            <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar Cliente..."
                    value={search}
                    onChangeText={handleSearch}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredClients}
                    keyExtractor={(item) => (item.id ? item.id.toString() : item.codigo ? item.codigo.toString() : Math.random().toString())}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            {!isSearching
                                ? "Escriba un nombre o código para buscar clientes."
                                : "No se encontraron clientes con esa búsqueda."}
                        </Text>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('ClientData')}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        margin: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        height: 50,
    },
    searchIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    list: {
        padding: 10,
    },
    clientItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    clientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    clientCode: {
        fontSize: 14,
        color: '#666',
    },
    arrow: {
        fontSize: 20,
        color: '#ccc',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#999',
    },
    fab: {
        position: 'absolute',
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        right: 30,
        bottom: 30,
        backgroundColor: '#007bff',
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
    },
    fabIcon: {
        fontSize: 30,
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ClientsManagementScreen;
