import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType?: string;
}

// Keeping Passenger interface compatible where possible, but mapping to backend user
export interface Passenger extends User {
  full_name: string; // Computed prop
  rating_average: number;
  total_rides: number;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      if (storedToken) {
        setToken(storedToken);
        // Verify token and get profile
        await loadProfile(storedToken);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      // If error (e.g. 401), clear token
      await AsyncStorage.removeItem('access_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (currentToken: string) => {
    try {
      const response = await apiRequest<any>('/auth/profile', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      // The backend returns { user: { ... } }
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const { access_token, user } = response;
    await AsyncStorage.setItem('access_token', access_token);
    setToken(access_token);
    setUser(user);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Split full name
    const names = fullName.trim().split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || '';

    const response = await apiRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        userType: 'passenger',
      }),
    });

    const { access_token, user } = response;
    await AsyncStorage.setItem('access_token', access_token);
    setToken(access_token);
    setUser(user);
  };

  const signOut = async () => {
    try {
      if (token) {
        // Optional: Call logout endpoint
        // await apiRequest('/auth/logout', { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (e) {
      // Ignore logout errors
    }
    await AsyncStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
