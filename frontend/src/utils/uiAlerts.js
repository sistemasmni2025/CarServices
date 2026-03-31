import { Alert, Platform } from 'react-native';

/**
 * Utility to display alerts consistently across Web and Native (Android/iOS).
 * It uses window.alert on web as a fallback for stability.
 */

export const showAlert = (title, message, onPress = null) => {
    console.log(`[Alert] ${title}:`, message);
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
        if (onPress) onPress();
    } else {
        Alert.alert(title, message, onPress ? [{ text: 'OK', onPress }] : []);
    }
};

export const showError = (title, error) => {
    // Extract message if it's an error object
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Error View] ${title}:`, message);

    if (Platform.OS === 'web') {
        window.alert(`⚠️ ${title}\n\n${message}`);
    } else {
        Alert.alert(`⚠️ ${title}`, message);
    }
};

export const showConfirm = (title, message, onConfirm, onCancel = null) => {
    if (Platform.OS === 'web') {
        const result = window.confirm(`${title}\n\n${message}`);
        if (result) {
            if (onConfirm) onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    } else {
        Alert.alert(
            title,
            message,
            [
                { text: 'Cancelar', style: 'cancel', onPress: onCancel },
                { text: 'Aceptar', onPress: onConfirm }
            ]
        );
    }
};
