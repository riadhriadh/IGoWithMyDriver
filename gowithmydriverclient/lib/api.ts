import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    // For Android Emulator, use 10.0.2.2 to access localhost of the host machine
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000/api/v1';
    }
    // For iOS Simulator or real device (if on same network, ideally use IP)
    return 'http://localhost:3000/api/v1';
};

export const API_URL = getBaseUrl();

export interface ApiError {
    statusCode: number;
    message: string;
    error: string;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw data as ApiError;
    }

    return data;
}
