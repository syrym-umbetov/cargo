export interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
}

export interface Client {
  id: number;
  clientCode: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
  };
}

export interface Item {
  id: number;
  clientId: number;
  productCode: string;
  arrivalDate: string;
  quantity: number;
  weight?: number;
  priceUsd?: number;
  exchangeRate?: number;
  amountKzt?: number;
  costPrice?: number;
  margin?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    clientCode: string;
    name: string;
    phone: string;
  };
}

export interface ExchangeRate {
  id: number;
  currencyFrom: string;
  currencyTo: string;
  rate: number;
  date: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ClientDetails: { clientId: number };
  AddClient: undefined;
  AddItem: { clientId?: number };
  ItemDetails: { itemId: number };
  Scanner: { clientId?: number };
};

export type MainTabParamList = {
  Clients: undefined;
  Items: undefined;
  Scanner: undefined;
  Profile: undefined;
};