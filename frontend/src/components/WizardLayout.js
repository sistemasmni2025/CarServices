import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const steps = [
    { id: 'history', title: 'Historial del vehículo', icon: 'history' },
    { id: 'style', title: 'Seleccionar estilo', icon: 'car-side' },
    { id: 'details', title: 'Detalles del vehículo', icon: 'file-document-outline' },
    { id: 'parts', title: 'Seleccionar partes', icon: 'puzzle-outline' },
    { id: 'photos', title: 'Seleccionar fotos', icon: 'camera-outline' },
    { id: 'damaged', title: 'Partes dañadas', icon: 'alert-circle-outline' },
    { id: 'signature', title: 'Firma del cliente', icon: 'pen' },
];

const WizardLayout = ({ currentStepId, onStepChange, children, title }) => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Sidebar */}
            <View style={styles.sidebar}>
                <View style={styles.logoContainer}>
                    <MaterialCommunityIcons name="tire" size={32} color="#007bff" />
                    <Text style={styles.logoText}>Multillantas</Text>
                </View>

                <ScrollView contentContainerStyle={styles.sidebarContent}>
                    {steps.map((step, index) => {
                        const isActive = step.id === currentStepId;
                        // Logic for "completed" could be passed in props too, simplified here
                        const isCompleted = steps.findIndex(s => s.id === currentStepId) > index;

                        return (
                            <TouchableOpacity
                                key={step.id}
                                style={[styles.stepItem, isActive && styles.stepItemActive]}
                                onPress={() => onStepChange(step.id)}
                            >
                                <View style={styles.stepLabel}>
                                    <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>
                                        {step.title}
                                    </Text>
                                </View>
                                <View style={styles.stepStatus}>
                                    {isCompleted ? (
                                        <MaterialCommunityIcons name="check-circle" size={20} color="#28a745" />
                                    ) : (
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={isActive ? "#007bff" : "#ccc"} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <TouchableOpacity style={styles.logoutButton}>
                    <MaterialCommunityIcons name="logout" size={20} color="#666" />
                    <Text style={styles.logoutText}>Salir</Text>
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{title || steps.find(s => s.id === currentStepId)?.title}</Text>
                    <View style={styles.headerActions}>
                        <Text style={styles.orderNumber}>Orden #12345</Text>
                    </View>
                </View>
                <View style={styles.contentBody}>
                    {children}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#f5f7fa', // Light gray background like TallerAlpha
    },
    sidebar: {
        width: 250,
        backgroundColor: '#fff',
        borderRightWidth: 1,
        borderRightColor: '#ddd',
        flexDirection: 'column',
    },
    logoContainer: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    logoText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#333',
    },
    sidebarContent: {
        paddingVertical: 10,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderLeftWidth: 4,
        borderLeftColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
    },
    stepItemActive: {
        backgroundColor: '#e6f2ff',
        borderLeftColor: '#007bff',
    },
    stepLabel: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 14,
        color: '#555',
        fontWeight: '600',
    },
    stepTitleActive: {
        color: '#007bff',
        fontWeight: 'bold',
    },
    stepStatus: {
        marginLeft: 10,
    },
    logoutButton: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 'auto',
    },
    logoutText: {
        marginLeft: 10,
        color: '#666',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        flexDirection: 'column',
    },
    header: {
        height: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderNumber: {
        fontSize: 14,
        color: '#666',
        backgroundColor: '#eee',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    contentBody: {
        flex: 1,
        padding: 20,
    },
});

export default WizardLayout;
