import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const steps = [
    { id: 'ingreso', title: 'Ingreso', number: 1 },
    { id: 'cliente', title: 'Cliente', number: 2 },
    { id: 'vehiculo', title: 'Vehículo', number: 3 },
    { id: 'fotos', title: 'Fotografías', number: 4 },
    { id: 'resumen', title: 'Resumen', number: 5 },
];

const HorizontalWizardLayout = ({ currentStepId, onStepChange, onBackToMenu, children }) => {
    /**
     * Layout Principal del Wizard Horizontal.
     * Muestra la barra de progreso superior y el contenido del paso actual.
     * Maneja la navegación entre pasos (aunque la lógica principal está en el Screen).
     */

    const { userName, selectedBranch } = useContext(AuthContext);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with Logo and Back Button */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={onBackToMenu} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/logo_nieto.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Center: Branch Name */}
                <View style={styles.headerCenter}>
                    {selectedBranch && (
                        <Text style={styles.branchName}>{selectedBranch.nombre}</Text>
                    )}
                </View>

                {/* Right: User Info */}
                <View style={styles.headerRight}>
                    <View style={styles.userInfo}>
                        <Text style={styles.welcomeText}>Bienvenido,</Text>
                        <Text style={styles.userName}>{userName || 'Usuario'}</Text>
                    </View>
                </View>
            </View>

            {/* Horizontal Stepper */}
            <View style={styles.stepperContainer}>
                {steps.map((step, index) => {
                    const isActive = step.id === currentStepId;
                    const isCompleted = steps.findIndex(s => s.id === currentStepId) > index;

                    return (
                        <View key={step.id} style={styles.stepWrapper}>
                            <View style={styles.stepItem}>
                                <TouchableOpacity
                                    style={[
                                        styles.stepCircle,
                                        isActive && styles.activeCircle,
                                        isCompleted && styles.completedCircle
                                    ]}
                                    onPress={() => onStepChange(step.id)}
                                >
                                    <Text style={[
                                        styles.stepNumber,
                                        isActive && styles.activeStepNumber,
                                        isCompleted && styles.completedStepNumber
                                    ]}>
                                        {step.number}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={[
                                    styles.stepLabel,
                                    isActive && styles.activeStepLabel,
                                    isCompleted && styles.completedStepLabel
                                ]}>
                                    {step.title}
                                </Text>
                            </View>
                            {/* Connector Line (except for last item) */}
                            {index < steps.length - 1 && (
                                <View style={styles.connectorContainer}>
                                    <View style={[
                                        styles.connector,
                                        isCompleted && styles.completedConnector
                                    ]} />
                                    {/* Intermediate Point */}
                                    <View style={[
                                        styles.intermediatePoint,
                                        isCompleted && styles.completedIntermediatePoint
                                    ]} />
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Content Area */}
            <View style={styles.content}>
                {children}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRight: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    branchName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007BFF',
        textAlign: 'center',
    },
    userInfo: {
        alignItems: 'flex-end',
    },
    welcomeText: {
        fontSize: 10,
        color: '#666',
    },
    userName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    backButton: {
        marginRight: 10,
        padding: 5,
    },
    logoContainer: {
        height: 40,
        justifyContent: 'center',
    },
    logoImage: {
        width: 150, // Approx width for the wide logo
        height: '100%',
    },

    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingVertical: 20,
        backgroundColor: '#fff',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    stepWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align tops of circles
        flex: 1,
    },
    stepItem: {
        alignItems: 'center',
        zIndex: 1, // Keep circle above line
        width: 80, // Fixed width for labels
    },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#e0e0e0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
    },
    activeCircle: {
        backgroundColor: '#007bff',
    },
    completedCircle: {
        backgroundColor: '#4CAF50', // Green for completed
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#999',
    },
    activeStepNumber: {
        color: '#fff',
    },
    completedStepNumber: {
        color: '#fff',
    },
    stepLabel: {
        fontSize: 11,
        color: '#999',
        textAlign: 'center',
    },
    activeStepLabel: {
        color: '#007bff',
        fontWeight: 'bold',
    },
    completedStepLabel: {
        color: '#333',
    },
    completedConnector: {
        backgroundColor: '#4CAF50',
    },
    connectorContainer: {
        flex: 1,
        height: 30, // Match circle height
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
        marginLeft: -10, // Adjust overlap
        marginRight: -10,
        zIndex: 0,
        position: 'relative',
    },
    connector: {
        position: 'absolute',
        width: '100%',
        height: 2,
        backgroundColor: '#e0e0e0',
        zIndex: 1,
    },
    intermediatePoint: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
        zIndex: 2, // Above line
    },
    completedIntermediatePoint: {
        backgroundColor: '#4CAF50',
    },
    content: {
        flex: 1,
        padding: 10,
    },
});

export default HorizontalWizardLayout;
