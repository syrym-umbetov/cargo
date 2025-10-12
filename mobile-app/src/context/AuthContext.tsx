import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse, Client } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  client: Client | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string) => Promise<void>;
  clientLogin: (clientCode: string, phoneLast4: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser, storedClient] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('client'),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedClient) {
          setClient(JSON.parse(storedClient));
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authApi.login(email, password);

      await Promise.all([
        AsyncStorage.setItem('authToken', response.token),
        AsyncStorage.setItem('user', JSON.stringify(response.user)),
      ]);

      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role?: string) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authApi.register(email, password, role);

      await Promise.all([
        AsyncStorage.setItem('authToken', response.token),
        AsyncStorage.setItem('user', JSON.stringify(response.user)),
      ]);

      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clientLogin = async (clientCode: string, phoneLast4: string) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authApi.clientLogin(clientCode, phoneLast4);

      const storageItems: [string, string][] = [
        ['authToken', response.token],
        ['user', JSON.stringify(response.user)],
      ];

      if (response.client) {
        storageItems.push(['client', JSON.stringify(response.client)]);
        setClient(response.client);
      }

      await Promise.all(storageItems.map(([key, value]) => AsyncStorage.setItem(key, value)));

      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('authToken'),
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('client'),
      ]);

      setToken(null);
      setUser(null);
      setClient(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    client,
    token,
    isLoading,
    login,
    register,
    clientLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};