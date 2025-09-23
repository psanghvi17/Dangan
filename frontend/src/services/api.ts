import axios from 'axios';
import { LoginCredentials, RegisterData, User, Item } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await api.post('/api/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Items API
export const itemsAPI = {
  getItems: async (): Promise<Item[]> => {
    const response = await api.get('/api/items/');
    return response.data;
  },

  getItem: async (id: number): Promise<Item> => {
    const response = await api.get(`/api/items/${id}`);
    return response.data;
  },

  createItem: async (item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item> => {
    const response = await api.post('/api/items/', item);
    return response.data;
  },

  updateItem: async (id: number, item: Partial<Item>): Promise<Item> => {
    const response = await api.put(`/api/items/${id}`, item);
    return response.data;
  },

  deleteItem: async (id: number): Promise<Item> => {
    const response = await api.delete(`/api/items/${id}`);
    return response.data;
  },
};

export default api;
