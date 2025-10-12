import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  AuthResponse,
  Client,
  Item,
  ExchangeRate,
  PaginatedResponse
} from '../types';

// Auto-detect API URL based on device
const getApiUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com/api';
  }

  // Get the manifest's debuggerHost which contains the local IP
  const debuggerHost = Constants.expoConfig?.hostUri;

  if (debuggerHost) {
    // Extract IP from debuggerHost (format: "192.168.0.111:8081")
    const host = debuggerHost.split(':')[0];
    return `http://${host}:3000/api`;
  }

  // Fallback to localhost (works in iOS simulator)
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiUrl();

console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  console.log('Making request to:', config.baseURL + config.url);
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, role?: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { email, password, role });
    return response.data;
  },
};

export const clientsApi = {
  getClients: async (page = 1, limit = 20, search?: string): Promise<PaginatedResponse<Client>> => {
    const params = { page, limit, ...(search && { search }) };
    const response = await api.get('/clients', { params });
    return {
      data: response.data.clients,
      pagination: response.data.pagination,
    };
  },

  getClient: async (id: number): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  createClient: async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  updateClient: async (id: number, clientData: Partial<Client>): Promise<Client> => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },

  deleteClient: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};

export const itemsApi = {
  getItems: async (page = 1, limit = 20, clientId?: number, productCode?: string): Promise<PaginatedResponse<Item>> => {
    const params = {
      page,
      limit,
      ...(clientId && { clientId }),
      ...(productCode && { productCode })
    };
    const response = await api.get('/items', { params });
    return {
      data: response.data.items,
      pagination: response.data.pagination,
    };
  },

  getItem: async (id: number): Promise<Item> => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  createItem: async (itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'client'>): Promise<Item> => {
    const response = await api.post('/items', itemData);
    return response.data;
  },

  updateItem: async (id: number, itemData: Partial<Item>): Promise<Item> => {
    const response = await api.put(`/items/${id}`, itemData);
    return response.data;
  },

  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`/items/${id}`);
  },
};

export const exchangeRatesApi = {
  getExchangeRates: async (currencyFrom = 'USD', currencyTo = 'KZT', limit = 10): Promise<ExchangeRate[]> => {
    const response = await api.get('/exchange-rates', {
      params: { currencyFrom, currencyTo, limit }
    });
    return response.data;
  },

  getLatestRate: async (currencyFrom = 'USD', currencyTo = 'KZT'): Promise<ExchangeRate> => {
    const response = await api.get('/exchange-rates/latest', {
      params: { currencyFrom, currencyTo }
    });
    return response.data;
  },

  createExchangeRate: async (rateData: Omit<ExchangeRate, 'id' | 'createdAt'>): Promise<ExchangeRate> => {
    const response = await api.post('/exchange-rates', rateData);
    return response.data;
  },
};

export default api;