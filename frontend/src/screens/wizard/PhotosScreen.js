import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadPhoto } from '../../services/photoService'; // Import upload service

const { width } = Dimensions.get('window');
// 3 columns for even more compactness
const COLUMN_WIDTH = (width - 60) / 3;

const PhotoSlot = React.memo(({ label, guideImage, capturedImage, onCapture }) => (
    <View style={styles.slotContainer}>
        <Text style={styles.slotLabel} numberOfLines={1}>{label}</Text>
        <TouchableOpacity style={styles.photoCard} onPress={onCapture}>
            {capturedImage ? (
                <Image
                    source={{ uri: capturedImage }}
                    style={styles.capturedImage}
                    resizeMethod="resize" // CRITICAL for Android Memory
                />
            ) : (
                <ImageBackground
                    source={guideImage}
                    style={styles.guideBackground}
                    imageStyle={{ opacity: 0.3, borderRadius: 10 }}
                >
                    <View style={styles.overlay}>
                        <MaterialCommunityIcons name="camera" size={20} color="#555" />
                    </View>
                </ImageBackground>
            )}
            {capturedImage && (
                <View style={styles.successBadge}>
                    <MaterialCommunityIcons name="check-circle" size={14} color="#28a745" />
                </View>
            )}
        </TouchableOpacity>
    </View>
));

const PhotosScreen = ({ data, orderId, onUpdate, onNext }) => {
    /**
     * Paso 4 del Wizard: Captura de Evidencia Fotográfica.
     * Permite tomar fotos de diferentes ángulos del vehículo.
     * Maneja la compresión, guardado temporal y subida de imágenes.
     */
    const [activeTab, setActiveTab] = useState('exterior');
    const [photos, setPhotos] = useState(data);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
    const [uploadedKeys, setUploadedKeys] = useState(new Set()); // Track uploaded photos

    const photoLabels = {
        frontal: 'ExtFront',
        lateralIzquierdo: 'ExtLatIzq',
        lateralDerecho: 'ExtLatDer',
        trasero: 'ExtTras',
        interior1: 'IntTab',
        interior2: 'IntAsientos',
        interior3: 'IntPuertas',
        interior4: 'IntTecho',
        adicional: 'OtrosMotor'
    };

    useEffect(() => {
        setPhotos(data);
    }, [data]);

    // Helper to resize image to safe dimensions (e.g. 1024px)
    const processImage = async (uri) => {
        /**
         * Procesa la imagen capturada.
         * En Web: Convierte a Base64 para persistencia.
         * En Móvil: Redimensiona y comprime para optimizar subida.
         */
        try {
            // For Web: Convert to Base64 to ensure persistence across reloads
            if (Platform.OS === 'web') {
                // If it's already a base64 string, return it
                if (uri.startsWith('data:image')) return uri;

                const response = await fetch(uri);
                const blob = await response.blob();

                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result); // Returns data:image/jpeg;base64,...
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 500 } }], // Extremely Safe for Display
                { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manipResult.uri;
        } catch (error) {
            console.log("Error processing image (returning original):", error);
            return uri; // CRITICAL: Fallback to original if manipulation fails to avoid data loss
        }
    };

    const handleSaveAndUpload = async () => {
        // Filter out photos that have already been uploaded
        const photosToUpload = Object.entries(photos).filter(([key, uri]) =>
            uri !== null && !uploadedKeys.has(key)
        );

        if (photosToUpload.length === 0) {
            alert('No hay fotos nuevas para subir.');
            return;
        }

        if (!orderId) {
            alert('Error: No se encontró el ID de la Orden. Regrese al paso 1.');
            return;
        }

        setUploading(true);
        setUploadStatus(null);

        try {
            const uploadPromises = photosToUpload.map(async ([key, uri]) => {
                console.log(`Uploading ${key} for Order ${orderId}...`);
                const label = photoLabels[key] || "Foto General";
                const url = await uploadPhoto(uri, label, orderId);
                if (url) {
                    return key; // Return key on success
                }
                throw new Error(`Failed to upload ${key}`);
            });

            const results = await Promise.all(uploadPromises);

            // Mark successful uploads
            setUploadedKeys(prev => {
                const newSet = new Set(prev);
                results.forEach(key => newSet.add(key));
                return newSet;
            });

            setUploadStatus('success');

            // Auto-hide success message after 2 seconds
            setTimeout(() => {
                setUploadStatus(null);
                setUploading(false);
            }, 2000);

        } catch (error) {
            console.error("Error uploading photos:", error);
            setUploadStatus('error');
            setUploading(false);
            // Error stays visible until user dismisses or retries
            setTimeout(() => setUploadStatus(null), 3000);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const pendingResult = await ImagePicker.getPendingResultAsync();
                if (pendingResult && !pendingResult.canceled && pendingResult.assets && pendingResult.assets.length > 0) {
                    const key = await AsyncStorage.getItem('PENDING_PHOTO_KEY');
                    if (key) {
                        const originalUri = pendingResult.assets[0].uri;
                        console.log(`Restoring photo for ${key}:`, originalUri);

                        // Process before saving to state
                        const processedUri = await processImage(originalUri);

                        const newPhotos = { ...data, [key]: processedUri };
                        setPhotos(newPhotos);
                        onUpdate(newPhotos);
                        await AsyncStorage.removeItem('PENDING_PHOTO_KEY');
                    }
                }
            } catch (e) {
                console.log("Error restoring pending result:", e);
            }
        })();
    }, []);

    const handleCapture = async (key) => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                alert('Se necesita permiso para usar la cámara');
                return;
            }

            await AsyncStorage.setItem('PENDING_PHOTO_KEY', key);
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.2, // Keep low quality for initial capture
            });

            await AsyncStorage.removeItem('PENDING_PHOTO_KEY');

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const originalUri = result.assets[0].uri;
                console.log(`Photo captured for ${key}:`, originalUri);

                // Process before saving to state
                const processedUri = await processImage(originalUri);

                const newPhotos = { ...photos, [key]: processedUri };
                setPhotos(newPhotos);
                onUpdate(newPhotos);
            }
        } catch (error) {
            console.error("Error launching camera:", error);
            alert('Error al abrir la cámara');
        }
    };

    const categories = [
        { id: 'exterior', label: 'Exterior', icon: 'car-side' },
        { id: 'interior', label: 'Interior', icon: 'steering' },
        { id: 'otros', label: 'Otros', icon: 'engine-outline' },
    ];

    const renderExterior = () => (
        <View style={styles.grid}>
            <PhotoSlot
                label="Frontal"
                guideImage={require('../../../assets/guides/frontal.png')}
                capturedImage={photos.frontal}
                onCapture={() => handleCapture('frontal')}
            />
            <PhotoSlot
                label="Lat. Izquierdo"
                guideImage={require('../../../assets/guides/left.png')}
                capturedImage={photos.lateralIzquierdo}
                onCapture={() => handleCapture('lateralIzquierdo')}
            />
            <PhotoSlot
                label="Lat. Derecho"
                guideImage={require('../../../assets/guides/right.png')}
                capturedImage={photos.lateralDerecho}
                onCapture={() => handleCapture('lateralDerecho')}
            />
            <PhotoSlot
                label="Trasero"
                guideImage={require('../../../assets/guides/rear.png')}
                capturedImage={photos.trasero}
                onCapture={() => handleCapture('trasero')}
            />
        </View>
    );

    const renderInterior = () => (
        <View style={styles.grid}>
            <PhotoSlot
                label="Tablero"
                guideImage={require('../../../assets/guides/interior.png')}
                capturedImage={photos.interior1}
                onCapture={() => handleCapture('interior1')}
            />
            <PhotoSlot
                label="Asientos"
                guideImage={require('../../../assets/guides/interior.png')}
                capturedImage={photos.interior2}
                onCapture={() => handleCapture('interior2')}
            />
            <PhotoSlot
                label="Puertas"
                guideImage={require('../../../assets/guides/interior.png')}
                capturedImage={photos.interior3}
                onCapture={() => handleCapture('interior3')}
            />
            <PhotoSlot
                label="Techo"
                guideImage={require('../../../assets/guides/interior.png')}
                capturedImage={photos.interior4}
                onCapture={() => handleCapture('interior4')}
            />
        </View>
    );

    const renderOtros = () => (
        <View style={styles.grid}>
            <PhotoSlot
                label="Motor / Otros"
                guideImage={require('../../../assets/guides/engine.png')}
                capturedImage={photos.adicional}
                onCapture={() => handleCapture('adicional')}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.tabItem, activeTab === cat.id && styles.activeTabItem]}
                        onPress={() => setActiveTab(cat.id)}
                    >
                        <MaterialCommunityIcons
                            name={cat.icon}
                            size={18}
                            color={activeTab === cat.id ? '#fff' : '#666'}
                        />
                        <Text style={[styles.tabLabel, activeTab === cat.id && styles.activeTabLabel]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeTab === 'exterior' && renderExterior()}
                {activeTab === 'interior' && renderInterior()}
                {activeTab === 'otros' && renderOtros()}

                <View style={styles.footer}>
                    {/* Upload Status Modal */}
                    <Modal visible={uploading} transparent={true} animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                {uploadStatus === 'success' ? (
                                    <>
                                        <MaterialCommunityIcons name="check-circle" size={48} color="#28a745" />
                                        <Text style={styles.modalText}>¡Fotos Guardadas!</Text>
                                    </>
                                ) : uploadStatus === 'error' ? (
                                    <>
                                        <MaterialCommunityIcons name="alert-circle" size={48} color="#dc3545" />
                                        <Text style={styles.modalText}>Error</Text>
                                    </>
                                ) : (
                                    <>
                                        <ActivityIndicator size="large" color="#007bff" />
                                        <Text style={styles.modalText}>Procesando...</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </Modal>

                    {/* El botón de 'Subir Avance' ha sido removido porque el backend externo ya no soporta subidas individuales. 
                        Toda la Evidencia (Base64) se ensambla y envía en el Paso 5 (Resumen) a través de ingresos/crear. */}

                    <TouchableOpacity style={styles.continueButton} onPress={onNext}>
                        <Text style={styles.continueButtonText}>Continuar</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 5,
        marginHorizontal: 15,
        marginVertical: 12,
        borderRadius: 15,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    tabItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 12,
        gap: 5,
    },
    activeTabItem: {
        backgroundColor: '#007bff',
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    activeTabLabel: {
        color: '#fff',
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingBottom: 30,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    slotContainer: {
        width: COLUMN_WIDTH,
        marginBottom: 10,
    },
    slotLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
        marginLeft: 2,
    },
    photoCard: {
        backgroundColor: '#fff',
        width: '100%',
        height: COLUMN_WIDTH * 0.85,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    guideBackground: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    capturedImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    successBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    footerStatus: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
    footer: {
        alignItems: 'center',
        marginTop: 30,
    },
    continueButton: {
        backgroundColor: '#007bff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 20,
        elevation: 3,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 5,
        minWidth: 150,
    },
    modalText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
    },
});

export default React.memo(PhotosScreen);
