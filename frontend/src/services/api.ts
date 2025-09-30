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

// Clients API
export interface ClientDTO {
  client_id: string;
  client_name: string;
  email?: string;
  description?: string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
  created_on?: string;
}

export interface ClientCreateDTO {
  client_name: string;
  email?: string;
  description?: string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
}

export interface ClientUpdateDTO {
  client_name?: string;
  email?: string;
  description?: string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
}

export const clientsAPI = {
  list: async (params?: { skip?: number; limit?: number }): Promise<{ items: ClientDTO[]; total: number }> => {
    const res = await api.get('/api/clients/', { params });
    return res.data;
  },
  get: async (clientId: string): Promise<ClientDTO> => {
    const res = await api.get(`/api/clients/${clientId}`);
    return res.data;
  },
  create: async (payload: ClientCreateDTO): Promise<ClientDTO> => {
    const res = await api.post('/api/clients/', payload);
    return res.data;
  },
  update: async (clientId: string, payload: ClientUpdateDTO): Promise<ClientDTO> => {
    const res = await api.put(`/api/clients/${clientId}`, payload);
    return res.data;
  },
  delete: async (clientId: string): Promise<{ message: string }> => {
    const res = await api.delete(`/api/clients/${clientId}`);
    return res.data;
  },
};

// Candidates API
export interface CandidateCreateDTO {
  invoice_contact_name: string;
  invoice_email?: string;
  invoice_phone?: string;
  address1?: string;
  address2?: string;
  town?: string;
  county?: string;
  eircode?: string;
  pps_number?: string;
  date_of_birth?: string;
}

export interface CandidateDTO {
  candidate_id: string;
  invoice_contact_name?: string;
  invoice_email?: string;
  invoice_phone?: string;
  address1?: string;
  address2?: string;
  town?: string;
  county?: string;
  eircode?: string;
  pps_number?: string;
  date_of_birth?: string;
  created_on?: string;
}

export interface CandidateListItemDTO {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email_id?: string;
  created_on?: string;
}

export interface CandidateListResponseDTO {
  candidates: CandidateListItemDTO[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ClientOptionDTO {
  client_id: string;
  client_name?: string;
}

export interface CandidateClientCreateDTO {
  candidate_id: string;
  client_id: string;
  placement_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  status?: number;
}

export interface CandidateClientOutDTO {
  pcc_id: string;
  candidate_id: string;
  client_id: string;
  placement_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  status?: number;
  created_on?: string;
}

export interface RateTypeDTO { rate_type_id: number; rate_type_name?: string }
export interface RateFrequencyDTO { rate_frequency_id: number; rate_frequency_name?: string }
export interface ContractRateCreateDTO {
  rate_type: number;
  rate_frequency: number;
  pay_rate?: number;
  bill_rate?: number;
  date_applicable?: string;
  date_end?: string;
}
export interface ContractRateOutDTO extends ContractRateCreateDTO { id: number; pcc_id: string; created_on?: string }

export const candidatesAPI = {
  list: async (params?: { page?: number; limit?: number }): Promise<CandidateListResponseDTO> => {
    console.log('Making API call to /api/candidates/list with params:', params);
    try {
      const res = await api.get('/api/candidates/list', { params });
      console.log('API response:', res.data);
      return res.data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  listAll: async (): Promise<CandidateDTO[]> => {
    console.log('Making API call to /api/candidates/ to get all candidates');
    try {
      const res = await api.get('/api/candidates/');
      console.log('API response:', res.data);
      return res.data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },
  
  create: async (payload: CandidateCreateDTO): Promise<CandidateDTO> => {
    const res = await api.post('/api/candidates/', payload);
    return res.data;
  },
  
  seedData: async (): Promise<{ seeded: boolean; message?: string; error?: string }> => {
    const res = await api.post('/api/candidates/seed');
    return res.data;
  },
  
  get: async (user_id: string): Promise<CandidateListItemDTO> => {
    const res = await api.get(`/api/candidates/${user_id}`);
    return res.data;
  },
  
  update: async (user_id: string, payload: Partial<CandidateCreateDTO>): Promise<CandidateListItemDTO> => {
    const res = await api.put(`/api/candidates/${user_id}`, payload);
    return res.data;
  },
  
  getClientOptions: async (): Promise<ClientOptionDTO[]> => {
    const res = await api.get('/api/candidates/clients/options');
    return res.data;
  },
  
  createClientRelationship: async (payload: CandidateClientCreateDTO): Promise<CandidateClientOutDTO> => {
    const res = await api.post('/api/candidates/client-relationship', payload);
    return res.data;
  },
  
  getClientRelationships: async (user_id: string): Promise<CandidateClientOutDTO[]> => {
    const res = await api.get(`/api/candidates/${user_id}/client-relationships`);
    return res.data;
  },

  getRateTypes: async (): Promise<RateTypeDTO[]> => {
    const res = await api.get('/api/candidates/rate-types');
    return res.data;
  },

  getRateFrequencies: async (): Promise<RateFrequencyDTO[]> => {
    const res = await api.get('/api/candidates/rate-frequencies');
    return res.data;
  },

  createRatesForPcc: async (pcc_id: string, rates: ContractRateCreateDTO[]): Promise<ContractRateOutDTO[]> => {
    const res = await api.post(`/api/candidates/client-relationship/${pcc_id}/rates`, rates);
    return res.data;
  },
};

export default api;

// Timesheets API
export type TimesheetStatus = 'Open' | 'Close';

export interface TimesheetSummaryDTO {
  timesheet_id: string;
  weekLabel: string; // e.g., "Week 1"
  monthLabel: string;
  filledCount: number;
  notFilledCount: number;
  status: TimesheetStatus;
}

export interface TimesheetEntryDTO {
  entry_id: string;
  timesheet_id: string;
  employee_name: string;
  employee_code: string;
  client_name: string;
  filled: boolean;
  standard_hours: number;
  rate2_hours: number;
  rate3_hours: number;
  rate4_hours: number;
  rate5_hours: number;
  rate6_hours: number;
  holiday_hours: number;
  bank_holiday_hours: number;
  created_on?: string;
  updated_on?: string;
}

export interface TimesheetDetailDTO {
  timesheet_id: string;
  status?: string;
  month?: string;
  week?: string;
  date_range?: string;
  entries: TimesheetEntryDTO[];
}

export interface TimesheetEntryCreateDTO {
  timesheet_id: string;
  employee_name: string;
  employee_code: string;
  client_name: string;
  filled?: boolean;
  standard_hours?: number;
  rate2_hours?: number;
  rate3_hours?: number;
  rate4_hours?: number;
  rate5_hours?: number;
  rate6_hours?: number;
  holiday_hours?: number;
  bank_holiday_hours?: number;
}

export interface TimesheetEntryUpdateDTO {
  employee_name?: string;
  employee_code?: string;
  client_name?: string;
  filled?: boolean;
  standard_hours?: number;
  rate2_hours?: number;
  rate3_hours?: number;
  rate4_hours?: number;
  rate5_hours?: number;
  rate6_hours?: number;
  holiday_hours?: number;
  bank_holiday_hours?: number;
}

export interface TimesheetCreateDTO {
  month: string;
  week: string;
  client_id?: string | null;
  candidate_ids: string[];
}

export const timesheetsAPI = {
  listSummaries: async (params?: { month?: string }): Promise<TimesheetSummaryDTO[]> => {
    const res = await api.get('/api/timesheets/', { params });
    return res.data;
  },
  
  getDetail: async (timesheetId: string): Promise<TimesheetDetailDTO> => {
    const res = await api.get(`/api/timesheets/${timesheetId}`);
    return res.data;
  },
  
  create: async (timesheet: TimesheetCreateDTO): Promise<TimesheetDetailDTO> => {
    const res = await api.post('/api/timesheets/', timesheet);
    return res.data;
  },
  
  createEntry: async (timesheetId: string, entry: TimesheetEntryCreateDTO): Promise<TimesheetEntryDTO> => {
    const res = await api.post(`/api/timesheets/${timesheetId}/entries`, entry);
    return res.data;
  },
  
  updateEntry: async (entryId: string, entry: TimesheetEntryUpdateDTO): Promise<TimesheetEntryDTO> => {
    const res = await api.put(`/api/timesheets/entries/${entryId}`, entry);
    return res.data;
  },
  
  seedData: async (): Promise<{ seeded: boolean; message?: string; error?: string }> => {
    const res = await api.post('/api/timesheets/seed');
    return res.data;
  },
};
