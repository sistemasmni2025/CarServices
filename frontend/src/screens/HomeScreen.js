import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { logout } from '../services/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
    const handleLogout = async () => {
        await logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    const menuItems = [
        { title: 'Clientes', screen: 'ClientsManagement', color: '#007bff', icon: 'account-group' },
        { title: 'Órdenes de Servicio', screen: 'ServiceOrders', color: '#28a745', icon: 'wrench-clock' },
        { title: 'Catálogo Vehículos', screen: 'Vehicles', color: '#ffc107', icon: 'car-sports' },
        { title: 'Inventario / Servicios', screen: 'Inventory', color: '#17a2b8', icon: 'package-variant-closed' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Multillantas Nieto</Text>
                    <Text style={styles.headerSubtitle}>Panel de Control</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <MaterialCommunityIcons name="logout" size={24} color="#ff6b6b" />
                    <Text style={styles.logoutText}>Salir</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.grid}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.card, { borderTopColor: item.color }]}
                        onPress={() => navigation.navigate(item.screen)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                            <MaterialCommunityIcons name={item.icon} size={40} color={item.color} />
                        </View>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#555" style={styles.arrowIcon} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212', // Dark Background
    },
    header: {
        padding: 20,
        backgroundColor: '#1e1e1e', // Darker Header
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#aaa',
        fontSize: 14,
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    logoutText: {
        color: '#ff6b6b',
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 14,
    },
    grid: {
        padding: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: '#1e1e1e', // Card Dark Background
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderTopWidth: 4, // Professional accent top border
        elevation: 4,
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 160,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    iconContainer: {
        padding: 15,
        borderRadius: 50,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        color: '#e0e0e0',
        marginBottom: 5,
    },
    arrowIcon: {
        marginTop: 'auto',
    }
});

export default HomeScreen;
