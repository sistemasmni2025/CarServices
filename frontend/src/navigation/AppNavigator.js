import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HorizontalWizardScreen from '../screens/HorizontalWizardScreen';
import LoadingScreen from '../components/LoadingScreen';
import BranchSelectionScreen from '../screens/BranchSelectionScreen';
import OrderSearchScreen from '../screens/OrderSearchScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

const Stack = createNativeStackNavigator();

// Export the main navigator
const AppNavigatorWrapper = () => {
    /**
     * Componente envoltorio para la navegación.
     * Maneja la lógica de autenticación para mostrar el stack de Login o el Dashboard.
     * También intenta recuperar el estado del Wizard si existe uno reciente (comentado por ahora).
     */
    const { userToken, isLoading } = useContext(AuthContext);
    const navigationRef = React.useRef();

    if (isLoading) {
        return <LoadingScreen />;
    }

    const onNavigationReady = async () => {
        // TEMPORARY FIX: Clear storage to prevent crash from old state
        // await AsyncStorage.clear(); 
        if (!userToken) return;
        try {
            const savedState = await AsyncStorage.getItem('WIZARD_STATE');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                const now = Date.now();
                // Check if state is recent (e.g., less than 24 hours old)
                // This prevents getting stuck in a loop from a very old session
                if (parsed.timestamp && (now - parsed.timestamp < 24 * 60 * 60 * 1000)) {
                    console.log("Found recent saved wizard state, redirecting...");
                    // We need to wait a tick for the navigator to be fully ready to handle the route
                    // setTimeout(() => {
                    //    navigationRef.current?.navigate('Wizard');
                    // }, 100);
                } else {
                    // Clear old state
                    await AsyncStorage.removeItem('WIZARD_STATE');
                }
            }
        } catch (e) {
            console.log("Error checking wizard state", e);
        }
    };

    return (
        <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userToken == null ? (
                    // Stack No Autenticado
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    // Stack Autenticado
                    <>
                        <Stack.Screen name="BranchSelection" component={BranchSelectionScreen} />
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="OrderSearch" component={OrderSearchScreen} />
                        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
                        <Stack.Screen name="Wizard" component={HorizontalWizardScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default AppNavigatorWrapper;
