import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VehicleListScreen = ({ vehicles, onSelect, onNew, isLoading }) => {
    /**
     * Pantalla de Lista de Vehículos.
     * Muestra los vehículos registrados del cliente seleccionado.
     * Permite buscar por placas o agregar uno nuevo.
     */
    const [searchQuery, setSearchQuery] = useState('');

    const filteredVehicles = React.useMemo(() => {
        return vehicles.filter(v => {
            if (!v) return false;
            // Safe safe access
            const placa = v.placas ? String(v.placas).toLowerCase() : '';
            const query = searchQuery ? String(searchQuery).toLowerCase() : '';
            return placa.includes(query);
        });
    }, [vehicles, searchQuery]);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Buscando vehículos...</Text>
            </View>
        );
    }

    const renderVehicleItem = ({ item }) => {
        // Defensive: Safe String Conversion to prevent crashes if backend sends objects/nulls
        const marca = item.marca ? String(item.marca) : '';
        const modelo = item.modelo ? String(item.modelo) : '';
        const anio = item.anio ? String(item.anio) : '';
        const placas = item.placas ? String(item.placas) : '';
        const serie = item.serie ? String(item.serie) : '';
        const color = item.color ? String(item.color) : '';

        return (
            <TouchableOpacity style={styles.card} onPress={() => onSelect(item)}>
                <View style={styles.iconContainer}>
                    <Ionicons name="car-sport" size={32} color="#4A90E2" />
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.brand}>{marca} {modelo} {anio}</Text>
                    <Text style={styles.placa}>Placas: {placas}</Text>
                    <Text style={styles.serie}>Serie: {serie}</Text>
                    {color ? <Text style={styles.color}>Color: {color}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <Text style={styles.headerTitle}>Vehículos Registrados</Text>
            <Text style={styles.subTitle}>Seleccione un vehículo o registre uno nuevo.</Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por placas..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="characters"
                />
            </View>

            {/* Temporary Debug: Show count */}
            <Text style={{ color: 'gray', fontSize: 12, marginBottom: 10 }}>
                Vehículos Encontrados: {filteredVehicles.length}
            </Text>

            <FlatList
                data={filteredVehicles}
                renderItem={renderVehicleItem}
                keyExtractor={(item, index) => index.toString()}
                ListEmptyComponent={
                    <View style={styles.card}>
                        <Text style={{ textAlign: 'center', color: '#666', padding: 20 }}>
                            {searchQuery ? 'No se encontraron vehículos con esas placas.' : 'No se encontraron vehículos registrados para este cliente.'}
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity style={styles.addButton} onPress={onNew}>
                <Ionicons name="add-circle-outline" size={24} color="#fff" style={styles.addIcon} />
                <Text style={styles.addButtonText}>Registrar Nuevo Vehículo</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    subTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: {
        marginRight: 15,
    },
    infoContainer: {
        flex: 1,
    },
    brand: {
        fontSize: 18,
        fontWeight: '600',
        color: '#222',
    },
    placa: {
        fontSize: 16,
        color: '#007AFF', // Highlight plate
        fontWeight: 'bold',
        marginTop: 2,
    },
    serie: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    color: {
        fontSize: 14,
        color: '#888',
        marginTop: 1,
    },
    addButton: {
        backgroundColor: '#28a745',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        marginTop: 10,
        elevation: 3,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    addIcon: {
        marginRight: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#333',
    }
});

export default VehicleListScreen;
