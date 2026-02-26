import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { brandNames } from '../../utils/vehicleData';

const VehicleStyleScreen = ({ onSelect }) => {
    /**
     * Pantalla de Selección de Marca.
     * Muestra una cuadrícula de marcas de vehículos comunes.
     */
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Seleccione la Marca</Text>
            <View style={styles.grid}>
                {brandNames.map((brandName) => (
                    <TouchableOpacity
                        key={brandName}
                        style={styles.card}
                        onPress={() => onSelect(brandName)}
                    >
                        <MaterialCommunityIcons name="car" size={32} color="#555" />
                        <Text style={styles.cardTitle}>{brandName}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => onSelect('OTRA')}
                >
                    <MaterialCommunityIcons name="dots-horizontal-circle-outline" size={32} color="#555" />
                    <Text style={styles.cardTitle}>OTRA</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        alignItems: 'center',
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
    },
    card: {
        width: '30%', // 3 per row
        aspectRatio: 1,
        margin: '1.5%',
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#444',
        marginTop: 5,
        textAlign: 'center',
    },
});

export default VehicleStyleScreen;
