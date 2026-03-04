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
        firmaPrestador: null,
        firmaCliente: null,
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

    // Lógica Interna: Auto-obtener ID de Orden eliminada a petición del usuario.
    // El folio de la orden solo debe generarse al final del wizard (en guardar_total)
    // para evitar que se creen órdenes "borrador" abandonadas o duplicadas en la DB al entrar a la pantalla.

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
            // 1. Procesar Firmas si existen (Base64 -> File)
            let firmaPrestadorUri = null;
            let firmaClienteUri = null;

            if (currentData.firmaPrestador) {
                try {
                    if (Platform.OS === 'web') {
                        // En Web pasamos la cadena nativa y el services/orders.js le dará formato .bmp
                        firmaPrestadorUri = currentData.firmaPrestador;
                    } else {
                        const sigFilename = `firma_prestador_${currentData.ingreso.noOrden || Date.now()}.bmp`;
                        firmaPrestadorUri = `${FileSystem.cacheDirectory}${sigFilename}`;
                        const base64Data = currentData.firmaPrestador.split(',')[1] || currentData.firmaPrestador;
                        await FileSystem.writeAsStringAsync(firmaPrestadorUri, base64Data, { encoding: 'base64' });
                    }
                } catch (sigErr) {
                    console.error("Error saving provider signature:", sigErr);
                }
            }

            if (currentData.firmaCliente) {
                try {
                    if (Platform.OS === 'web') {
                        firmaClienteUri = currentData.firmaCliente;
                    } else {
                        const sigFilename = `firma_cliente_${currentData.ingreso.noOrden || Date.now()}.bmp`;
                        firmaClienteUri = `${FileSystem.cacheDirectory}${sigFilename}`;
                        const base64Data = currentData.firmaCliente.split(',')[1] || currentData.firmaCliente;
                        await FileSystem.writeAsStringAsync(firmaClienteUri, base64Data, { encoding: 'base64' });
                    }
                } catch (sigErr) {
                    console.error("Error saving consumer signature:", sigErr);
                }
            }

            // 2. Adjuntar las fotos y las firmas al payload del service
            const fotosDict = { ...currentData.fotos };
            if (firmaPrestadorUri) fotosDict['firmaPrestador'] = firmaPrestadorUri;
            if (firmaClienteUri) fotosDict['firmaCliente'] = firmaClienteUri;

            console.log("[Wizard] Bypassing individual photo uploads to /evidencias/nueva (Server returns 422). Photos will be handled if backend configures mega-payload support or another route.");

            // Ya no enviamos evidencia pesada en el MegaPayload para prevenir el error 1406
            // Las fotos se enviarán individualmente a /evidencias/nueva una vez que tengamos el OrdenID real
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

            // 4. CONSTRUIR MEGA-PAYLOAD (Alineado estrictamente con el formato del backend)
            const isoDateStr = new Date().toISOString().split('.')[0]; // Formato "YYYY-MM-DDTHH:mm:ss" sin ms ni Z
            const deliveryDateStr = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('.')[0];

            const megaPayload = {
                Orden: {
                    OrdenID: parseInt(currentData.ingreso?.noOrden || 0),
                    UsuarioID: parseInt(userData?.id || 1),
                    ClienteID: parseInt(currentData.cliente?.id || 0),
                    VehiculoID: parseInt(currentData.vehiculo?.details?.id || 0),
                    // Usamos fallback a 1 (ID Válido Mostrador) para AsesorID que es el Vendedor para evitar fallos de llave foránea.
                    // Y enviamos el ID seleccionado explícitamente como ApisoCve para el Asesor de Piso.
                    AsesorID: 1,
                    ApisoCve: parseInt(currentData.ingreso?.asesorId || userData?.usuarioclavepiso || 0),
                    OrdenIDGen: null,
                    OrdenTipo: "V",
                    OrdenFecha: isoDateStr,
                    OrdenFechaIngreso: isoDateStr,
                    OrdenFechaEntrega: deliveryDateStr,
                    OrdenObservaciones: currentData.vehiculo.details.observaciones || "Ingreso desde App Móvil/Tablet",
                    OrdenEstatus: "A",
                    SucursalID: parseInt(selectedBranch?.id || 1)
                },
                Cliente: {
                    ClienteClave: (currentData.cliente?.codigo || currentData.cliente?.id || "").toString(),
                    ClienteNombre: currentData.cliente?.nombre || "",
                    ClienteRazon: currentData.cliente?.razon_social || currentData.cliente?.nombre || "",
                    ClienteRegimen: currentData.cliente?.regimen_fiscal || "601 - General de Ley Personas Morales",
                    ClienteRFC: (currentData.cliente?.rfc || "XAXX010101000").substring(0, 13),
                    ClienteDomicilio: currentData.cliente?.domicilio || "Domicilio Conocido",
                    ClienteDomicilio2: currentData.cliente?.domicilio2 || "Centro",
                    ClienteCiudad: currentData.cliente?.ciudad || "Celaya",
                    ClienteEstadoClave: "GTO",
                    ClienteEstadoNombre: "Guanajuato",
                    ClienteCP: currentData.cliente?.cp || "38000",
                    ClienteCategoria: currentData.cliente?.categoria === "CONTADO" ? "1" : "1",
                    ClienteDiasCredito: 0,
                    ClienteFechaAlta: isoDateStr,
                    ClienteEstatus: "A",
                    ClienteIDGen: null
                },
                Vehiculo: {
                    VehiculoPlacas: currentData.vehiculo.details.plates || currentData.vehiculo.details.tag || "",
                    VehiculoMarca: currentData.vehiculo.details.brand || "",
                    VehiculoModelo: currentData.vehiculo.details.model ? `${currentData.vehiculo.details.model} ${currentData.vehiculo.details.year || ''}`.trim() : "",
                    VehiculoColor: currentData.vehiculo.details.color || "",
                    VehiculoNumSerie: currentData.vehiculo.details.chassis || null,
                    VehiculoIDGen: parseInt(currentData.vehiculo.details.id || 0),
                    ClienteID: parseInt(currentData.cliente?.id || 0)
                },
                Inspeccion: inspeccionPayload.length > 0 ? inspeccionPayload : [{
                    OrdenID: 0,
                    ValoracionID: 1,
                    InspeccionValor: 1
                }]
            };

            console.log("[Wizard] Sending Multipart Mega-Payload...");
            const result = await saveOrderTotal(megaPayload, fotosDict);
            console.log("[Wizard] Save Result:", result);

            if (result && (result.success !== false)) {
                // Trazar el resultado dual (REST + SOAP)
                const realFolio = result.soap_data && result.soap_data.Ordser ? result.soap_data.Ordser : (currentData.ingreso.noOrden || "N/A");
                const finalOrdenId = result.rest_data?.OrdenID || result.OrdenID || megaPayload.Orden.OrdenID;

                // Clean up memoria local
                setWizardData(initialWizardData);
                setCurrentStepId('ingreso');
                await AsyncStorage.removeItem(STORAGE_KEY);

                if (Platform.OS === 'web') {
                    // On web, window.alert is synchronous and blocks the thread.
                    // The custom onPress buttons from React Native don't work reliably here.
                    window.alert("Orden Finalizada");
                    navigation.navigate('OrderSearch');
                } else {
                    Alert.alert(
                        "Orden Finalizada",
                        "La orden ha sido registrada y guardada exitosamente en el sistema.",
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
                throw new Error(result.message || result.error || "Error desconocido al guardar la orden.");
            }

        } catch (error) {
            console.error("Error in unified finish flow:", error);
            if (Platform.OS === 'web') {
                window.alert(`No se pudo guardar la orden: ${error.message}`);
            } else {
                Alert.alert("Error de Guardado", `No se pudo guardar la orden: ${error.message}`);
            }
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
                        onUpdate={(sigs) => {
                            if (sigs && sigs.firmaPrestador) handleUpdateData('firmaPrestador', sigs.firmaPrestador);
                            if (sigs && sigs.firmaCliente) handleUpdateData('firmaCliente', sigs.firmaCliente);
                        }}
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
