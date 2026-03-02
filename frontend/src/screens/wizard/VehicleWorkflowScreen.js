import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import VehicleStyleScreen from './VehicleStyleScreen';
import VehicleDetailsScreen from './VehicleDetailsScreen';
import VehicleListScreen from './VehicleListScreen';
import { searchVehiclesSoap, registerVehicleSoap } from '../../services/vehicles';

const VehicleWorkflowScreen = ({ data, client, onUpdate, onCompletion }) => {
    /**
     * Paso 3 del Wizard: Flujo de Vehículos.
     * Maneja sub-pasos:
     * 0. Lista de vehículos del cliente (si existen).
     * 1. Selección de Marca (si es nuevo).
     * 2. Detalles del vehículo.
     * 3. Resumen/Confirmación.
     */
    // Step 0: List (if exists), Step 1: Style, Step 2: Details
    // Step 0: List (if exists), Step 1: Style, Step 2: Details, Step 3: Summary (Selected)
    const [step, setStep] = useState(0);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialCheckDone, setInitialCheckDone] = useState(false);

    // Initial check: if data has details, go to Summary (Step 3)
    // Chequeo Inicial: Si ya hay datos, ir al resumen
    // Initial check: if data has details, go to Summary (Step 3)
    useEffect(() => {
        if (data && data.details && data.details.tag) {
            setStep(3);
            setLoading(false);
            setInitialCheckDone(true);
        }
    }, []);

    useEffect(() => {
        const checkVehicles = async () => {
            if (client) {
                // Priorizar ID SOAP (clienteidgen) sobre ID local
                const soapId = client.clienteidgen || client.id;
                console.log("Searching vehicles for SOAP ID:", soapId);

                setLoading(true);
                if (soapId && soapId !== '0') {
                    try {
                        const found = await searchVehiclesSoap(soapId);
                        console.log("Vehicles found:", found);
                        if (found && found.length > 0) {
                            setVehicles(found);
                        } else {
                            setVehicles([]);
                        }
                        if (!data.details?.tag) setStep(0); // Solo resetear si no hay vehículo seleccionado
                    } catch (e) {
                        console.error("Error searching vehicles:", e);
                        setVehicles([]);
                        if (!data.details?.tag) setStep(0);
                    } finally {
                        setLoading(false);
                        setInitialCheckDone(true);
                    }
                } else {
                    setVehicles([]);
                    setLoading(false);
                    setInitialCheckDone(true);
                    if (!data.details?.tag) setStep(0);
                }
            } else {
                setLoading(false);
            }
        };
        checkVehicles();
    }, [client]);

    const handleVehicleSelect = (vehicle) => {
        // Map SOAP vehicle to local state structure (Pre-fill details)
        const details = {
            tag: vehicle.placas,
            brand: vehicle.marca,
            model: vehicle.modelo,
            year: vehicle.anio ? String(vehicle.anio) : '', // Safe String conversion
            color: vehicle.color,
            chassis: vehicle.serie,
            transmission: 'Automática', // Default
            fuelType: 'Gasolina', // Default
            mileage: '',
            fuelLevel: 50,
            colorHex: '#FFFFFF',
            observaciones: '',
            isSoap: true,
            soapId: vehicle.placas
        };
        onUpdate({ ...data, details });
        setStep(2); // Go to Details directly
    };

    const handleNewVehicle = () => {
        // Skip Brand Selection (Step 1) -> Go directly to Details (Step 2)
        setStep(2);
    };

    const handleBrandSelect = (brandName) => {
        // Pre-fill brand in details, initialize the rest
        onUpdate({
            ...data,
            details: {
                tag: '',
                brand: brandName,
                model: '',
                year: '',
                color: '',
                chassis: '',
                transmission: 'Automática',
                fuelType: 'Gasolina',
                mileage: '',
                fuelLevel: 50,
                colorHex: '#FFFFFF',
                observaciones: ''
            }
        });
        setStep(2);
    };

    const handleDetailsUpdate = (details) => {
        onUpdate({ ...data, details });
    };

    const handleDetailsNext = async (currentDetails) => {
        // If it's a SOAP vehicle or a new vehicle, we should register it to get a local ID
        // if not already registered (i.e., no 'id' field in details)
        const detailsToRegister = currentDetails || data.details;

        if (detailsToRegister && !detailsToRegister.id) {
            console.log("Registering vehicle before proceeding...", detailsToRegister);
            try {
                // Map frontend structure to backend expectation if needed
                const payload = {
                    client_id: client.clienteidgen || client.id,
                    placas: detailsToRegister.tag,
                    marca: detailsToRegister.brand,
                    modelo: detailsToRegister.model,
                    anio: parseInt(detailsToRegister.year) || 0,
                    color: detailsToRegister.color,
                    serie: detailsToRegister.chassis,
                    motor: detailsToRegister.motor
                };

                const result = await registerVehicleSoap(payload);
                if (result && result.local_id) {
                    console.log("Vehicle registered successfully. Local ID:", result.local_id);
                    // Update global state with the new ID
                    const updatedDetails = { ...detailsToRegister, id: result.local_id };
                    onUpdate({ ...data, details: updatedDetails });
                }
            } catch (error) {
                console.error("Error registering vehicle:", error);
                Alert.alert("Error de Registro", "No se pudo registrar el vehículo en el sistema. Verifique su conexión o intente más tarde.");
            }
        } else {
            // Already has ID, just sync internal state to be safe
            if (currentDetails) handleDetailsUpdate(currentDetails);
        }

        if (onCompletion) {
            onCompletion();
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Cargando vehículos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {step === 3 && data.details && ( // Step 3: Summary 
                <View style={styles.summaryContainer}>
                    <Text style={styles.sectionTitle}>Vehículo Seleccionado</Text>
                    <View style={styles.card}>
                        <View style={styles.vehicleHeader}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name="car" size={30} color="#007bff" />
                            </View>
                            <View style={styles.vehicleInfo}>
                                <Text style={styles.vehicleTitle}>{data.details.brand} {data.details.model} {data.details.year}</Text>
                                <Text style={styles.vehicleSubtitle}>Placas: {data.details.tag}</Text>
                                <Text style={styles.vehicleSubtitle}>Color: {data.details.color}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.changeButton}
                            onPress={() => {
                                onUpdate({ ...data, details: null }); // Clear selection
                                setStep(0); // Check vehicles again? Or just go to list if loaded
                                // Retrigger search if needed or just use existing 'vehicles' if loaded?
                                // 'vehicles' state should persist.
                            }}
                        >
                            <Text style={styles.changeButtonText}>Cambiar Vehículo</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={() => {
                            if (onCompletion) onCompletion();
                        }}
                    >
                        <Text style={styles.continueButtonText}>Continuar</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}

            {step === 0 && (
                <VehicleListScreen
                    vehicles={vehicles}
                    onSelect={handleVehicleSelect}
                    onNew={handleNewVehicle}
                    isLoading={loading}
                />
            )}
            {step === 1 && (
                <VehicleStyleScreen
                    onSelect={handleBrandSelect}
                />
            )}
            {step === 2 && (
                <VehicleDetailsScreen
                    data={data.details}
                    client={client} // Pass client for registration
                    onUpdate={handleDetailsUpdate}
                    onNext={handleDetailsNext}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 2,
        marginBottom: 20,
        alignItems: 'center',
    },
    vehicleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    vehicleSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    changeButton: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    changeButtonText: {
        color: '#666',
        fontWeight: 'bold',
    },
    continueButton: {
        backgroundColor: '#007bff',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
});

export default VehicleWorkflowScreen;
