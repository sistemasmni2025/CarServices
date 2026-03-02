import React, { useState, useEffect, useContext } from 'react';
import { uploadPhoto, prepareEvidencePayload } from '../services/photoService';
import { saveInspections } from '../services/inspections';
import { getNextOrderId, createOrder, updateExternalOrder, saveOrderTotal } from '../services/orders';
import { View, StyleSheet, Alert, ActivityIndicator, Text, Platform } from 'react-native';
import HorizontalWizardLayout from '../components/HorizontalWizardLayout';
import IngresoScreen from './wizard/IngresoScreen';
import ClientSearchScreen from './wizard/ClientSearchScreen';
import VehicleWorkflowScreen from './wizard/VehicleWorkflowScreen';
import PhotosScreen from './wizard/PhotosScreen';
import SummaryScreen from './wizard/SummaryScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import * as FileSystem from 'expo-file-system';
import { useIsFocused } from '@react-navigation/native';

const HorizontalWizardScreen = ({ navigation }) => {
    /**
     * Pantalla Principal del Wizard (Flujo de Trabajo).
     * Orquesta los pasos: Ingreso -> Cliente -> Vehículo -> Fotos -> Resumen.
     * Maneja el estado global del wizard y su persistencia.
     */
    const { userData, selectedBranch } = useContext(AuthContext);
    const [currentStepId, setCurrentStepId] = useState('ingreso');
    const [uploading, setUploading] = useState(false);
    const isFocused = useIsFocused();

    // REVERTED: Removed blocking UI and Redirect logic to restore previous state.
    // If Auth is missing, it will likely render normally but might have issues saving/loading.
    // This is the "known good" (albeit imperfect) state user requested.

    // ----------------------------------------------------------------------
    // PERSISTENCIA LOCAL Y AISLAMIENTO DE SESIONES
    // ----------------------------------------------------------------------
    // Generamos una clave única (STORAGE_KEY) combinando el ID del Usuario (U)
    // y el ID de la Sucursal (B). Esto garantiza que si Jorge empieza una orden
    // en Celaya, no le aparezcan los datos si cambia a Juriquilla, y que no
    // se crucen datos con otros asesores que usen la misma tablet.
    // El sufijo ':v2' fuerza un inicio limpio tras la actualización estructural.
    const STORAGE_KEY = userData && userData.id && selectedBranch && selectedBranch.id
        ? `@Multillantas:WizardSession:U${userData.id}:B${selectedBranch.id}:v2`
        : '@Multillantas:WizardSession:GUEST:v2';

    // Centralized Initial State
    const initialWizardData = {
        session: {
            sucursalId: selectedBranch?.id || null,
            sucursalNombre: selectedBranch?.SucursalNombre || '',
            usuarioId: userData?.id || null,
            usuarioNombre: userData ? `${userData.nombre} ${userData.apellido}` : '',
            timestamp: new Date().toISOString()
        },
        ingreso: {
            serie: '',
            noOrden: '',
            tipoOrden: 'Venta',
            fecha: new Date().toLocaleDateString('es-MX'),
            unidadNegocio: '1 - PATIO LOCAL',
            asesor: userData ? `${userData.nombre} ${userData.apellido}` : 'JUAN CAMPANUR',
            servicioForaneo: 'Ninguno',
            horaIngreso: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }),
            fechaEntrega: new Date().toLocaleDateString('es-MX'),
            horaEntrega: '7:00 PM'
        },
        cliente: null,
        vehiculo: {
            style: null,
            details: {
                tag: '',
                brand: '',
                model: '',
                year: '2018',
                transmission: 'Automática',
                fuelType: 'Gasolina',
                mileage: '',
                chassis: '',
                fuelLevel: 50,
                color: 'BLANCO',
                colorHex: '#FFFFFF',
                observaciones: ''
            }
        },
        fotos: {
            frontal: null,
            lateralIzquierdo: null,
            lateralDerecho: null,
            trasero: null,
            interior1: null,
            interior2: null,
            interior3: null,
            interior4: null,
            adicional: null,
        },
        firma: null,
    };

    const [wizardData, setWizardData] = useState(initialWizardData);
    console.log(`[Wizard] UserData:`, userData);


    const [isLoaded, setIsLoaded] = useState(false);

    const stepsOrder = ['ingreso', 'cliente', 'vehiculo', 'fotos', 'resumen'];

    // Reset state when key changes (e.g. branch switch) to avoid stale data
    useEffect(() => {
        setWizardData(initialWizardData);
        setCurrentStepId('ingreso');
        setIsLoaded(false);
    }, [STORAGE_KEY]);

    // Restaurar estado al montar o cambiar clave
    useEffect(() => {
        const loadState = async () => {
            try {
                const savedState = await AsyncStorage.getItem(STORAGE_KEY);
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    if (parsed && parsed.data && parsed.step) {
                        // ----------------------------------------------------------------------
                        // RECUPERACIÓN DE BORRADORES (MANEJO INTERNO)
                        // ----------------------------------------------------------------------

                        // En Web, Alert.alert nativo no soporta botones personalizados, 
                        // usamos window.confirm para preguntar si desea descartar.
                        if (Platform.OS === 'web') {
                            const discard = window.confirm("Se encontró una orden en curso (borrador). ¿Deseas DESCARTARLA y empezar una orden NUEVA?\n\n- [Aceptar] = Borrar Todo y Empezar Nueva\n- [Cancelar] = Continuar Borrador");
                            if (discard) {
                                AsyncStorage.removeItem(STORAGE_KEY).then(() => {
                                    setWizardData(initialWizardData);
                                    setCurrentStepId('ingreso');
                                    setIsLoaded(true);
                                });
                            } else {
                                setWizardData(parsed.data);
                                setCurrentStepId(parsed.step);
                                setIsLoaded(true);
                                console.log("[Wizard] State restored automatically (Web Mode)");
                            }
                            return;
                        }

                        // En Nativo (Android/iOS), preguntamos al usuario.
                        Alert.alert(
                            "Orden en curso",
                            `Se encontró una orden pendiente para esta sucursal. ¿Deseas continuarla o empezar una nueva?`,
                            [
                                {
                                    text: "Descartar",
                                    style: "destructive",
                                    onPress: async () => {
                                        await AsyncStorage.removeItem(STORAGE_KEY);
                                        setWizardData(initialWizardData);
                                        setCurrentStepId('ingreso');
                                        setIsLoaded(true);
                                    }
                                },
                                {
                                    text: "Continuar",
                                    onPress: () => {
                                        setWizardData(parsed.data);
                                        setCurrentStepId(parsed.step);
                                        setIsLoaded(true);
                                        console.log("Wizard state restored");
                                    }
                                }
                            ],
                            { cancelable: false }
                        );
                        return; // Wait for user choice
                    }
                }
            } catch (error) {
                console.log("Failed to load wizard state", error);
            } finally {
                // Si llegamos aquí (no hay savedState o hubo error), cargamos limpio.
                setIsLoaded(true);
            }
        };
        loadState();
    }, [STORAGE_KEY]);

    // Lógica Interna: Auto-obtener ID de Orden si falta
    useEffect(() => {
        const fetchOrderId = async () => {
            // Solo buscar si la restauración de estado está completa y la pantalla está ACTIVA
            if (isLoaded && isFocused && currentStepId === 'ingreso' && !wizardData.ingreso.noOrden) {
                try {
                    const sucursalId = selectedBranch ? selectedBranch.id : null;
                    const usuarioId = userData ? userData.id : null;
                    console.log(`[Wizard] Fetching Order ID for Sucursal: ${sucursalId}, User: ${usuarioId}`);
                    // Llama al servicio para obtener el siguiente ID de orden disponible.
                    // Se pasa el ID de sucursal y el ID de usuario (dos veces, ya que la API lo espera así).
                    const response = await getNextOrderId(sucursalId, usuarioId, usuarioId);
                    console.log("Next Order ID Response:", response); // Debugging

                    console.log("Next Order ID Response Keys:", Object.keys(response));
                    console.log("Values - idorden:", response.idorden, "NoOrden:", response.NoOrden, "noOrden:", response.noOrden, "OrdenID:", response.OrdenID);

                    if (response) {
                        // Support multiple possible key formats based on user description and common APIs
                        setWizardData(prev => ({
                            ...prev,
                            ingreso: {
                                ...prev.ingreso,
                                serie: (response.serie || response.OrdenSerie || '').toString(),
                                noOrden: (response.idorden || response.OrdenID || '').toString()
                            }
                        }));
                    }
                } catch (error) {
                    console.log("Failed to auto-fetch Order ID", error);
                }
            }
        };
        if (selectedBranch && userData && isLoaded && isFocused) {
            fetchOrderId();
        }
    }, [currentStepId, wizardData.ingreso.noOrden, selectedBranch, userData, isLoaded, isFocused]);

    // Save state on change (Debounced to 500ms for stability)
    useEffect(() => {
        if (!isLoaded) return;

        const timer = setTimeout(async () => {
            try {
                const stateToSave = {
                    data: wizardData,
                    step: currentStepId,
                    lastModified: new Date().toISOString()
                };
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
                // console.log(`[Persistence] Saved to ${STORAGE_KEY} (Debounced)`);
            } catch (error) {
                console.error("Failed to save wizard state", error);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [wizardData, currentStepId, STORAGE_KEY, isLoaded]);

    const handleSaveSection = async (stepKey, data) => {
        /**
         * Explicitly saves a section's data.
         * Used to ensure data is "linked" and persisted per-step.
         */
        handleUpdateData(stepKey, data);
    };

    const handleUpdateData = (stepKey, newData) => {
        setWizardData(prev => {
            const newState = {
                ...prev,
                [stepKey]: newData
            };

            // If client changes, reset vehicle selection
            if (stepKey === 'cliente') {
                const oldClientId = prev.cliente?.id;
                const newClientId = newData?.id;

                if (oldClientId !== newClientId) {
                    console.log("Client changed, resetting vehicle selection");
                    newState.vehiculo = { ...initialWizardData.vehiculo };
                }
            }

            return newState;
        });
    };

    const handleStepChange = (stepId) => {
        setCurrentStepId(stepId);
    };

    const handleNext = () => {
        const currentIndex = stepsOrder.indexOf(currentStepId);
        if (currentIndex < stepsOrder.length - 1) {
            setCurrentStepId(stepsOrder[currentIndex + 1]);
        }
    };

    const handleFinish = async (finalData = null) => {
        // Usa finalData si se provee (SummaryScreen envía wizardData + firma)
        const currentData = finalData || wizardData;
        console.log('[Wizard] Starting Consolidated Order Submission...', currentData);
        setUploading(true);

        try {
            // 1. Procesar Firma si existe (Base64 -> File)
            let signatureUri = null;
            if (currentData.firma) {
                try {
                    if (Platform.OS === 'web') {
                        // En Web, la firma ya es una cadena Base64 generada por el bypass o capture
                        signatureUri = currentData.firma;
                    } else {
                        const sigFilename = `firma_${currentData.ingreso.noOrden || Date.now()}.png`;
                        signatureUri = `${FileSystem.cacheDirectory}${sigFilename}`;
                        const base64Data = currentData.firma.split(',')[1] || currentData.firma;
                        await FileSystem.writeAsStringAsync(signatureUri, base64Data, { encoding: 'base64' });
                    }
                } catch (sigErr) {
                    console.error("Error saving signature:", sigErr);
                }
            }

            // 2. Subir Fotos Independentimentemente al Nuevo Endpoint
            const fotosDict = { ...currentData.fotos };
            if (signatureUri) fotosDict['firma'] = signatureUri;

            console.log("[Wizard] Uploading photos sequentially to dedicated endpoint...");

            const strLabels = {
                frontal: "ExtFront",
                lateralIzquierdo: "ExtLatIzq",
                lateralDerecho: "ExtLatDer",
                trasero: "ExtTras",
                interior1: "IntTab",
                interior2: "IntAsientos",
                interior3: "IntPuertas",
                interior4: "IntTecho",
                adicional: "OtrosMotor",
                firma: "FirmaCliente"
            };

            const uploadPromises = Object.entries(fotosDict).map(async ([key, uri]) => {
                if (uri && (uri.startsWith('file:') || uri.startsWith('blob:') || uri.startsWith('data:'))) {
                    const label = strLabels[key] || "Foto General";
                    try {
                        await uploadPhoto(uri, label, currentData.ingreso.noOrden);
                    } catch (err) {
                        console.error(`[Wizard] Error uploading photo ${key}:`, err);
                    }
                }
            });
            await Promise.all(uploadPromises);

            // Ya no enviamos evidencia pesada en el MegaPayload para prevenir el error 1406
            const evidenciaPayload = [];

            // 3. Preparar Inspección
            const inventory = currentData.vehiculo?.details?.inventory || {};
            const inspeccionPayload = Object.entries(inventory)
                .map(([id, itemData]) => ({
                    InspeccionID: null,
                    OrdenID: 0,
                    ValoracionID: parseInt(id),
                    InspeccionValor: (typeof itemData === 'object' ? !!itemData.checked : !!itemData) ? 1 : 0
                }));

            // 4. CONSTRUIR MEGA-PAYLOAD
            const megaPayload = {
                Orden: {
                    OrdenID: currentData.ingreso.noOrden || null, // Se pasa el Borrador ID para su limpieza (cleanup en backend)
                    UsuarioID: userData?.id || 1,
                    ClienteID: currentData.cliente?.id || null,
                    VehiculoID: currentData.vehiculo?.details?.id || null,
                    AsesorID: userData?.id || 1,
                    OrdenIDGen: null,
                    OrdenTipo: currentData.ingreso.tipoOrden === 'Venta' ? "1" : "2",
                    OrdenFecha: new Date().toISOString(),
                    OrdenFechaIngreso: new Date().toISOString(),
                    OrdenFechaEntrega: null,
                    OrdenObservaciones: currentData.vehiculo.details.observaciones || "",
                    OrdenEstatus: "C",
                    SucursalID: selectedBranch?.id || 1,
                    OrdenAbierta: 0
                },
                Cliente: {
                    ClienteID: null,
                    ClienteClave: currentData.cliente?.codigo || "",
                    ClienteNombre: currentData.cliente?.nombre || "",
                    ClienteRazon: currentData.cliente?.razon_social || null,
                    ClienteRegimen: currentData.cliente?.regimen_fiscal || "PERSONA FISICA",
                    ClienteRFC: (currentData.cliente?.rfc || "").substring(0, 13),
                    ClienteDomicilio: currentData.cliente?.domicilio || "",
                    ClienteDomicilio2: currentData.cliente?.domicilio2 || "",
                    ClienteCiudad: currentData.cliente?.ciudad || "",
                    ClienteEstadoClave: currentData.cliente?.estado || "",
                    ClienteEstadoNombre: currentData.cliente?.estado || "",
                    ClienteCP: currentData.cliente?.cp || "",
                    ClienteCategoria: currentData.cliente?.categoria || "CONTADO",
                    ClienteDiasCredito: 0,
                    ClienteFechaAlta: new Date().toISOString(),
                    ClienteEstatus: "A",
                    ClienteIDGen: (currentData.cliente?.clienteidgen || currentData.cliente?.id || "0").toString()
                },
                Vehiculo: {
                    VehiculoID: null,
                    VehiculoPlacas: currentData.vehiculo.details.tag || "",
                    VehiculoMarca: currentData.vehiculo.details.brand || "",
                    VehiculoModelo: currentData.vehiculo.details.model ? `${currentData.vehiculo.details.model} ${currentData.vehiculo.details.year || ''}`.trim() : null,
                    VehiculoColor: currentData.vehiculo.details.color || null,
                    VehiculoNumSerie: currentData.vehiculo.details.chassis || null,
                    VehiculoIDGen: parseInt(currentData.vehiculo.details.id || 0),
                    ClienteID: null
                },
                Evidencia: evidenciaPayload,
                Inspeccion: inspeccionPayload
            };

            console.log("[Wizard] Sending Mega-Payload...");
            const result = await saveOrderTotal(megaPayload);
            console.log("[Wizard] Save Result:", result);

            if (result && (result.success !== false)) {
                // Trazar el resultado dual (REST + SOAP)
                const realFolio = result.soap_data && result.soap_data.Ordser ? result.soap_data.Ordser : (currentData.ingreso.noOrden || "N/A");

                // Clean up memoria local
                setWizardData(initialWizardData);
                setCurrentStepId('ingreso');
                await AsyncStorage.removeItem(STORAGE_KEY);

                if (Platform.OS === 'web') {
                    // On web, window.alert is synchronous and blocks the thread.
                    // The custom onPress buttons from React Native don't work reliably here.
                    window.alert(`La orden ${realFolio} ha sido registrada y guardada exitosamente en el sistema.`);
                    navigation.navigate('OrderSearch');
                } else {
                    Alert.alert(
                        "Orden Finalizada",
                        `La orden ${realFolio} ha sido registrada y guardada exitosamente en el sistema.`,
                        [
                            {
                                text: "OK",
                                onPress: () => {
                                    // Redireccionar a la pantalla de lista de ordenes (OrderSearch)
                                    navigation.navigate('OrderSearch');
                                }
                            }
                        ]
                    );
                }

            } else {
                throw new Error(result.error || "Error desconocido al guardar la orden.");
            }

        } catch (error) {
            console.error("Error in unified finish flow:", error);
            Alert.alert("Error de Guardado", `No se pudo guardar la orden completa: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };


    const renderStepContent = () => {
        switch (currentStepId) {
            case 'ingreso':
                return (
                    <IngresoScreen
                        data={wizardData.ingreso}
                        onUpdate={(data) => handleUpdateData('ingreso', data)}
                        onNext={handleNext}
                    />
                );
            case 'cliente':
                return (
                    <ClientSearchScreen
                        data={wizardData.cliente}
                        onUpdate={(data) => handleUpdateData('cliente', data)}
                        onNext={handleNext}
                    />
                );
            case 'vehiculo':
                return (
                    <VehicleWorkflowScreen
                        data={wizardData.vehiculo}
                        client={wizardData.cliente}
                        onUpdate={(data) => handleUpdateData('vehiculo', data)}
                        onCompletion={handleNext}
                    />
                );
            case 'fotos':
                return (
                    <PhotosScreen
                        data={wizardData.fotos}
                        orderId={wizardData.ingreso.noOrden} // Pass Order ID
                        onUpdate={(data) => handleUpdateData('fotos', data)}
                        onNext={handleNext}
                    />
                );
            case 'resumen':
                return (
                    <SummaryScreen
                        wizardData={wizardData}
                        onUpdate={(sig) => handleUpdateData('firma', sig)}
                        onFinish={handleFinish}
                    />
                );
            default:
                return (
                    <IngresoScreen
                        data={wizardData.ingreso}
                        onUpdate={(data) => handleUpdateData('ingreso', data)}
                        onNext={handleNext}
                    />
                );
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <HorizontalWizardLayout
                currentStepId={currentStepId}
                onStepChange={handleStepChange}
                onBackToMenu={() => navigation.goBack()}
            >
                {renderStepContent()}
            </HorizontalWizardLayout>

            {uploading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color="#007bff" />
                        <Text style={styles.loadingText}>Subiendo fotos y finalizando...</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 5,
    },
    loadingText: {
        marginTop: 10,
        color: '#333',
        fontWeight: 'bold',
    }
});

export default HorizontalWizardScreen;
