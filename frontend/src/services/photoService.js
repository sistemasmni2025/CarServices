import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

import api from './api';

// Use remote endpoint directly
const UPLOAD_URL = 'http://172.16.71.173:8000/evidencias/nueva';

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

export const uploadPhoto = async (photoUri, token, orderId, type = "1") => {
    if (!photoUri) return null;

    try {
        const optimizedUri = await optimizeImage(photoUri);
        const formData = new FormData();
        const filename = optimizedUri.split('/').pop();

        if (Platform.OS === 'web') {
            const fetchResponse = await fetch(optimizedUri);
            const blob = await fetchResponse.blob();
            formData.append('file', blob, filename);
        } else {
            formData.append('file', {
                uri: Platform.OS === 'ios' ? optimizedUri.replace('file://', '') : optimizedUri,
                name: filename,
                type: 'image/jpeg',
            });
        }

        formData.append('orden_id', orderId);
        formData.append('tipoevidenciaclave', type);

        console.log(`[PhotoService] Uploading ${filename} to ${UPLOAD_URL}...`);

        const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        console.log('[PhotoService] Upload Result:', result);

        if (response.ok) {
            return result.url || result.path || true;
        } else {
            console.error('[PhotoService] Upload failed:', result);
            return null;
        }
    } catch (error) {
        console.error('[PhotoService] Network Error:', error);
        return null;
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
        firmaPrestador: 100,
        firmaCliente: 101
    };

    const strLabels = {
        frontal: "EXTFRON",
        lateralIzquierdo: "EXTLATIZQ",
        lateralDerecho: "EXTLATDER",
        trasero: "EXTTRAS",
        interior1: "INTTABL",
        interior2: "INTASIEN",
        interior3: "INTPUER",
        interior4: "INTTECH",
        adicional: "OTRMOT",
        firmaPrestador: "FirmaPrestador",
        firmaCliente: "FirmaCliente"
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
