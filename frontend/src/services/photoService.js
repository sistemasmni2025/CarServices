import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

import api from './api';

// Use remote endpoint directly
const UPLOAD_URL = 'http://172.16.71.199:8000/api/proxy/upload';

const optimizeImage = async (uri) => {
    /**
     * Optimiza la imagen antes de subirla.
     * Redimensiona a 1280px y comprime al 60% (formato JPEG).
     */
    try {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [
                { resize: { width: 1280 } } // resolución máxima
            ],
            {
                compress: 0.6, // 60% calidad (ideal móvil)
                format: ImageManipulator.SaveFormat.JPEG,
            }
        );

        console.log("[PhotoService] Imagen optimizada:", result);
        return result.uri;

    } catch (e) {
        console.log("[PhotoService] Error optimizando imagen:", e);
        return uri; // fallback: usar original
    }
};

/**
 * Uploads a single photo to the external service.
 * @param {string} photoUri - The local URI of the photo.
 * @returns {Promise<string>} - The remote URL of the uploaded photo.
 */
/**
 * Uploads a single photo to the external service.
 * Subida de foto al servidor externo.
 * Maneja FormData compatible con Móvil y Web.
 * @param {string} photoUri - The local URI of the photo.
 * @returns {Promise<string>} - The remote URL of the uploaded photo.
 */
export const uploadPhoto = async (photoUri, label = "Foto", orderId) => {
    if (!photoUri) return null;

    try {
        const optimizedUri = await optimizeImage(photoUri);

        const formData = new FormData();
        const filename = optimizedUri.split('/').pop();

        // Infer type from extension
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        if (Platform.OS === 'web') {
            // Web: Fetch the URI to get a Blob
            const fetchResponse = await fetch(optimizedUri);
            const blob = await fetchResponse.blob();
            formData.append('foto', blob, filename);
        } else {
            // Native: Use the legacy object format
            formData.append('foto', {
                uri: Platform.OS === 'ios' ? photoUri.replace('file://', '') : photoUri,
                name: filename,
                type: type,
            });
        }

        // Add label as 'tipo' for backend identification
        formData.append('tipo', label);

        // Add Order ID if present
        if (orderId) {
            formData.append('ordenid', orderId);
        }

        console.log(`[PhotoService] Uploading ${filename} to ${UPLOAD_URL}...`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 90000); // Pa que aumentes el tiempo si tarda mucho mi estimado

        const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                // Content-Type removed to allow boundary generation
            }
        });
        clearTimeout(timeout);


        const result = await response.json();
        console.log('[PhotoService] Upload Result:', result);

        if (response.ok && result.ok && result.url) {
            const serviceHost = 'http://172.16.71.199:8000';
            return result.url.startsWith('http') ? result.url : `${serviceHost}${result.url}`;
        } else {
            console.error('[PhotoService] Upload failed:', result);
            return null; // Or throw error?
        }
    } catch (error) {
        console.error('[PhotoService] Network Error:', error);
        return null; // Fail gracefully for now, maybe allow retry?
    }
};

/**
 * Convierte una imagen local a Base64 para el payload consolidado.
 */
export const getImageBase64 = async (uri) => {
    if (!uri) return null;
    try {
        const optimizedUri = await optimizeImage(uri);

        // Fallback para Web: No podemos usar expo-file-system
        if (Platform.OS === 'web') {
            const response = await fetch(optimizedUri);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result.split(',')[1];
                    resolve(base64data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        // Nativo: Usar FileSystem
        const base64 = await FileSystem.readAsStringAsync(optimizedUri, {
            encoding: 'base64',
        });
        return base64;
    } catch (error) {
        console.error("[PhotoService] Error converting to Base64:", error);
        return null;
    }
};

/**
 * Prepara el arreglo de Evidencia para el payload consolidado.
 */
export const prepareEvidencePayload = async (fotos, orderId) => {
    const photoLabels = {
        frontal: 1,
        lateralIzquierdo: 2,
        lateralDerecho: 3,
        trasero: 4,
        interior1: 5,
        interior2: 6,
        interior3: 7,
        interior4: 8,
        adicional: 9,
        firma: 10
    };

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
    const evidencia = [];
    const timestamp = new Date().toISOString();

    for (const [key, uri] of Object.entries(fotos)) {
        if (uri) {
            const base64 = await getImageBase64(uri);
            if (base64) {
                evidencia.push({
                    EvidenciaID: null,
                    OrdenID: 0,
                    TipoEvidenciaID: photoLabels[key] || 99,
                    Fotografia: base64,
                    EvidenciaFechaToma: timestamp,
                    EvidenciaEstatus: "A"
                });
            }
        }
    }
    return evidencia;
};
