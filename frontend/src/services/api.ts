import axios from 'axios';
import { LoginCredentials, RegisterData, User, Item, MUser, MUserSignup, MUserLogin, ForgotPasswordRequest, ResetPasswordRequest, PasswordResetResponse, ClientRateDTO, ClientRateCreateDTO, ClientRateUpdateDTO, RateTypeDTO, RateFrequencyDTO, ClientCandidateDTO, CostCenterDTO, CostCenterCreateDTO, CostCenterUpdateDTO } from '../types';

// Default to same-origin so nginx proxy `/api` works in production without envs
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('m_token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
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

  // MUser Auth endpoints
  signupMUser: async (data: MUserSignup): Promise<MUser> => {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },

  loginMUser: async (credentials: MUserLogin) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  getCurrentMUser: async (): Promise<MUser> => {
    const response = await api.get('/api/auth/me-m');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<PasswordResetResponse> => {
    const response = await api.post('/api/auth/forgot-password', { email_id: email });
    return response.data;
  },

  resetPassword: async (token: string, new_password: string): Promise<PasswordResetResponse> => {
    const response = await api.post('/api/auth/reset-password', { token, new_password });
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
  active_contracts_count?: number;
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
  // Client Rates
  getRates: async (clientId: string): Promise<ClientRateDTO[]> => {
    const res = await api.get(`/api/clients/${clientId}/rates`);
    return res.data;
  },
  createRate: async (clientId: string, payload: ClientRateCreateDTO): Promise<ClientRateDTO> => {
    const res = await api.post(`/api/clients/${clientId}/rates`, payload);
    return res.data;
  },
  updateRate: async (clientId: string, rateId: string, payload: ClientRateUpdateDTO): Promise<ClientRateDTO> => {
    const res = await api.put(`/api/clients/${clientId}/rates/${rateId}`, payload);
    return res.data;
  },
  deleteRate: async (clientId: string, rateId: string): Promise<{ message: string }> => {
    const res = await api.delete(`/api/clients/${clientId}/rates/${rateId}`);
    return res.data;
  },
  // Rate Types and Frequencies
  getRateTypes: async (): Promise<RateTypeDTO[]> => {
    const res = await api.get('/api/clients/rate-types');
    return res.data;
  },
  getRateFrequencies: async (): Promise<RateFrequencyDTO[]> => {
    const res = await api.get('/api/clients/rate-frequencies');
    return res.data;
  },
  // Client Candidates
  getCandidates: async (clientId: string): Promise<ClientCandidateDTO[]> => {
    const res = await api.get(`/api/clients/${clientId}/candidates`);
    return res.data;
  },
};

// Candidates API
export interface CandidateCreateDTO {
  invoice_contact_name: string;
  invoice_email?: string | string[];
  invoice_phone?: string;
  address1?: string;
  address2?: string;
  town?: string;
  county?: string;
  eircode?: string;
  pps_number?: string;
  date_of_birth?: string;
  bank_account_number?: string;
  bank_name?: string;
  // User fields
  first_name?: string;
  last_name?: string;
  email_id?: string;
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
  client_name?: string;
  contract_start_date?: string;
  contract_end_date?: string;
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

export interface ContractRateCreateDTO {
  rate_type: number;
  rate_frequency: number;
  pay_rate?: number;
  bill_rate?: number;
  date_applicable?: string;
  date_end?: string;
  tcccc_id?: string;
}
export interface ContractRateOutDTO extends ContractRateCreateDTO { id: number; pcc_id: string; created_on?: string }

export interface ContractRateUpdateDTO {
  rate_type?: number;
  rate_frequency?: number;
  pay_rate?: number;
  bill_rate?: number;
  date_applicable?: string;
  date_end?: string;
  tcccc_id?: string;
}

export interface ContractWithRatesCreateDTO {
  candidate_id: string;
  client_id: string;
  placement_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  status?: number;
  rates: ContractRateCreateDTO[];
  pcc_id?: string;  // If provided, update existing relationship
  tcr_ids?: number[];  // If provided, update existing rates
}

export interface ContractWithRatesOutDTO {
  pcc_id: string;
  candidate_id: string;
  client_id: string;
  placement_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  status?: number;
  created_on?: string;
  rates: ContractRateOutDTO[];
}

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
    console.log('Making API call to /api/candidates/ to get all candidates with client info');
    try {
      const res = await api.get('/api/candidates/');
      console.log('API response:', res.data);
      return res.data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  listActive: async (): Promise<CandidateDTO[]> => {
    console.log('Making API call to /api/candidates/active to get active candidates');
    try {
      const res = await api.get('/api/candidates/active');
      console.log('API response:', res.data);
      return res.data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  listPending: async (): Promise<CandidateDTO[]> => {
    console.log('Making API call to /api/candidates/pending to get pending candidates');
    try {
      const res = await api.get('/api/candidates/pending');
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
  
  update: async (user_id: string, payload: Partial<CandidateCreateDTO & { first_name?: string; last_name?: string; email_id?: string }>): Promise<CandidateListItemDTO> => {
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


  createRatesForPcc: async (pcc_id: string, rates: ContractRateCreateDTO[]): Promise<ContractRateOutDTO[]> => {
    const res = await api.post(`/api/candidates/client-relationship/${pcc_id}/rates`, rates);
    return res.data;
  },

  getRatesByPcc: async (pcc_id: string): Promise<ContractRateOutDTO[]> => {
    const res = await api.get(`/api/candidates/client-relationship/${pcc_id}/rates`);
    return res.data;
  },

  // Cost centers by pcc (for rates dropdown)
  getCostCentersByPcc: async (pcc_id: string): Promise<any[]> => {
    const res = await api.get(`/api/candidates/client-relationship/${pcc_id}/cost-centers`);
    return res.data;
  },

  getRatesForCandidateClient: async (candidate_id: string, client_id: string): Promise<ContractRateOutDTO[]> => {
    const res = await api.get(`/api/candidates/client-relationship/rates`, { params: { candidate_id, client_id } });
    return res.data;
  },

  updateRate: async (tcr_id: number, update: ContractRateUpdateDTO): Promise<ContractRateOutDTO> => {
    const res = await api.put(`/api/candidates/rates/${tcr_id}`, update);
    return res.data;
  },

  deleteRate: async (tcr_id: number): Promise<{ deleted: boolean }> => {
    const res = await api.delete(`/api/candidates/rates/${tcr_id}`);
    return res.data;
  },

  getContractRatesForCandidateClient: async (candidateId: string, clientId: string): Promise<ContractRateOutDTO[]> => {
    const res = await api.get(`/api/candidates/client-relationship/rates?candidate_id=${candidateId}&client_id=${clientId}`);
    return res.data;
  },

  getContractRatesForCandidate: async (candidateId: string): Promise<ContractRateOutDTO[]> => {
    const res = await api.get(`/api/candidates/${candidateId}/rates`);
    return res.data;
  },

  // Rate Types and Frequencies (for candidates)
  getRateTypes: async (): Promise<RateTypeDTO[]> => {
    const res = await api.get('/api/candidates/rate-types');
    return res.data;
  },
  getRateFrequencies: async (): Promise<RateFrequencyDTO[]> => {
    const res = await api.get('/api/candidates/rate-frequencies');
    return res.data;
  },
  getAllRateTypes: async (): Promise<RateTypeDTO[]> => {
    const res = await api.get('/api/candidates/rate-types');
    return res.data;
  },
  getAllRateFrequencies: async (): Promise<RateFrequencyDTO[]> => {
    const res = await api.get('/api/candidates/rate-frequencies');
    return res.data;
  },


  getCandidateRatesMatrix: async (candidateIds: string[]): Promise<Record<string, any[]>> => {
    const res = await api.post('/api/candidates/rates-matrix', candidateIds);
    return res.data;
  },

  getCandidateClientInfo: async (candidateIds: string[]): Promise<Record<string, string>> => {
    const res = await api.post('/api/candidates/client-info', candidateIds);
    return res.data;
  },

  getCandidatePccInfo: async (candidateIds: string[]): Promise<Record<string, { client_name: string; pcc_id: string }>> => {
    const res = await api.post('/api/candidates/pcc-info', candidateIds);
    return res.data;
  },

  createContractWithRates: async (contractData: ContractWithRatesCreateDTO): Promise<ContractWithRatesOutDTO> => {
    const res = await api.post('/api/candidates/contract-with-rates', contractData);
    return res.data;
  },

  // Cost Center functions
  getCostCenters: async (userId: string): Promise<any[]> => {
    const res = await api.get(`/api/candidates/${userId}/cost-centers`);
    return res.data;
  },

  assignCostCenter: async (userId: string, costCenterData: any): Promise<any> => {
    const res = await api.post(`/api/candidates/${userId}/cost-centers`, costCenterData);
    return res.data;
  },

  removeCostCenter: async (userId: string, relationshipId: string): Promise<any> => {
    const res = await api.delete(`/api/candidates/${userId}/cost-centers/${relationshipId}`);
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

export interface ContractorHoursCreateDTO {
  contractor_id: string; // candidate_id
  work_date: string; // YYYY-MM-DD for week date
  timesheet_id: string; // server enforces from path but we send for clarity
  standard_hours?: number;
  on_call_hours?: number;
  status?: string;
  start_time?: string | null;
  end_time?: string | null;
  week?: number | null;
  day?: string | null;
  weekend_hours?: number | null;
  bank_holiday_hours?: number | null;
  total_hours?: number | null;
  project_no?: string | null;
  standard_bill_rate?: number | null;
  standard_pay_rate?: number | null;
  oncall_pay_rate?: number | null;
  oncall_bill_rate?: number | null;
  weekend_pay_rate?: number | null;
  weekend_bill_rate?: number | null;
  bankholiday_pay_rate?: number | null;
  bankholiday_bill_rate?: number | null;
  double_hours?: string | null;
  triple_hours?: string | null;
  dedh_hours?: string | null;
  tcr_id?: number | null;
  double_pay_rate?: number | null;
  double_bill_rate?: number | null;
  triple_bill_rate?: number | null;
  triple_pay_rate?: number | null;
  dedh_pay_rate?: number | null;
  dedh_bill_rate?: number | null;
}

export interface ContractorHoursDTO extends ContractorHoursCreateDTO {
  tch_id: string;
  created_on?: string;
  updated_on?: string;
}

export interface ContractorHoursUpsertDTO extends Partial<ContractorHoursCreateDTO> {
  tch_id?: string;
  rate_hours?: ContractorRateHoursCreateDTO[];
}

// Contractor Rate Hours DTOs
export interface ContractorRateHoursBaseDTO {
  tch_id?: string;  // Made optional for upsert operations
  rate_frequency_id: number;
  rate_type_id: number;
  tcr_id: number;
  quantity?: number;
  pay_rate?: number;
  bill_rate?: number;
}

export interface ContractorRateHoursCreateDTO extends ContractorRateHoursBaseDTO {
  created_by?: string;
}

export interface ContractorRateHoursUpdateDTO {
  rate_frequency_id?: number;
  rate_type_id?: number;
  tcr_id?: number;
  quantity?: number;
  pay_rate?: number;
  bill_rate?: number;
  updated_by?: string;
}

export interface ContractorRateHoursOutDTO extends ContractorRateHoursBaseDTO {
  tcrh_id: number;
  created_on?: string;
  updated_on?: string;
  created_by?: string;
  updated_by?: string;
  deleted_by?: string;
  deleted_on?: string;
}

export interface MultipleRateHoursCreateDTO {
  tch_id: string;
  rate_entries: ContractorRateHoursCreateDTO[];
  created_by?: string;
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
  
  getLatest: async (): Promise<{ timesheet_id: string; month: string; week: string; status: string; created_on: string }> => {
    const res = await api.get('/api/timesheets/latest');
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
  saveContractorHours: async (timesheetId: string, rows: ContractorHoursCreateDTO[]) => {
    const res = await api.post(`/api/timesheets/${timesheetId}/contractor-hours`, rows);
    return res.data as any[];
  },
  listContractorHours: async (timesheetId: string): Promise<ContractorHoursDTO[]> => {
    const res = await api.get(`/api/timesheets/${timesheetId}/contractor-hours`);
    return res.data;
  },
  upsertContractorHours: async (timesheetId: string, rows: ContractorHoursUpsertDTO[]): Promise<ContractorHoursDTO[]> => {
    const res = await api.post(`/api/timesheets/${timesheetId}/contractor-hours/upsert`, rows);
    return res.data;
  },
  
  seedData: async (): Promise<{ seeded: boolean; message?: string; error?: string }> => {
    const res = await api.post('/api/timesheets/seed');
    return res.data;
  },
  
  // Contractor Rate Hours API
  createContractorRateHours: async (multipleRates: MultipleRateHoursCreateDTO): Promise<ContractorRateHoursOutDTO[]> => {
    const res = await api.post('/api/timesheets/contractor-rate-hours/', multipleRates);
    return res.data;
  },
  
  upsertContractorRateHours: async (multipleRates: MultipleRateHoursCreateDTO): Promise<ContractorRateHoursOutDTO[]> => {
    const res = await api.post('/api/timesheets/contractor-rate-hours/upsert', multipleRates);
    return res.data;
  },
  
  getContractorRateHours: async (tchId: string): Promise<ContractorRateHoursOutDTO[]> => {
    const res = await api.get(`/api/timesheets/contractor-rate-hours/${tchId}`);
    return res.data;
  },
  
  updateContractorRateHours: async (tcrhId: number, update: ContractorRateHoursUpdateDTO): Promise<ContractorRateHoursOutDTO> => {
    const res = await api.put(`/api/timesheets/contractor-rate-hours/${tcrhId}`, update);
    return res.data;
  },
  
  deleteContractorRateHours: async (tcrhId: number, deletedBy: string): Promise<{ message: string }> => {
    const res = await api.delete(`/api/timesheets/contractor-rate-hours/${tcrhId}?deleted_by=${deletedBy}`);
    return res.data;
  },
  
  deleteAllContractorRateHoursForTch: async (tchId: string, deletedBy: string): Promise<{ message: string }> => {
    const res = await api.delete(`/api/timesheets/contractor-rate-hours/tch/${tchId}/all?deleted_by=${deletedBy}`);
    return res.data;
  },
};

// Invoice API
export interface InvoiceDTO {
  invoice_id: string;
  invoice_num?: string;
  invoice_date?: string;
  amount?: number;
  total_amount?: number;
  status?: string;
  pcc_id?: string;
  timesheet_id?: string;
  created_on?: string;
  updated_on?: string;
  deleted_on?: string;
  created_by?: string;
  updated_by?: string;
  deleted_by?: string;
}

export interface GenerateInvoiceRequestDTO {
  candidateId: string;
  clientId: string;
  week: string;
  invoiceDate: string;
}

export interface InvoiceLineItemDTO {
  pili_id: number;
  invoice_id: string;
  type?: number;
  quantity?: number;
  rate?: number;
  timesheet_id?: string;
  m_rate_name?: string;
  total?: number;
  tcr_id?: number;
  created_on?: string;
  updated_on?: string;
  created_by?: string;
  updated_by?: string;
  deleted_by?: string;
  deleted_on?: string;
  rate_type_name?: string;
  rate_frequency_name?: string;
}

export interface GenerateInvoiceResponseDTO {
  invoice_id: string;
  invoice_num: string;
  invoice_date: string;
  line_items: InvoiceLineItemDTO[];
  total_amount: number;
}

export interface InvoiceWithLineItemsDTO {
  invoice: InvoiceDTO;
  line_items: InvoiceLineItemDTO[];
}

export const invoicesAPI = {
  list: async (): Promise<InvoiceDTO[]> => {
    const res = await api.get('/api/invoices/');
    return res.data;
  },
  
  get: async (invoiceId: string): Promise<InvoiceDTO> => {
    const res = await api.get(`/api/invoices/${invoiceId}`);
    return res.data;
  },
  
  getWithLineItems: async (invoiceId: string): Promise<InvoiceWithLineItemsDTO> => {
    const res = await api.get(`/api/invoices/${invoiceId}/details`);
    return res.data;
  },
  
  generate: async (request: GenerateInvoiceRequestDTO): Promise<GenerateInvoiceResponseDTO> => {
    const res = await api.post('/api/invoices/generate', request);
    return res.data;
  },
};

export const costCentersAPI = {
  getByClient: async (clientId: string): Promise<CostCenterDTO[]> => {
    const res = await api.get(`/api/clients/${clientId}/cost-centers`);
    return res.data;
  },
  
  get: async (costCenterId: string): Promise<CostCenterDTO> => {
    const res = await api.get(`/api/cost-centers/${costCenterId}`);
    return res.data;
  },
  
  create: async (clientId: string, costCenter: CostCenterCreateDTO): Promise<CostCenterDTO> => {
    const res = await api.post(`/api/clients/${clientId}/cost-centers`, costCenter);
    return res.data;
  },
  
  update: async (costCenterId: string, costCenter: CostCenterUpdateDTO): Promise<CostCenterDTO> => {
    const res = await api.put(`/api/cost-centers/${costCenterId}`, costCenter);
    return res.data;
  },
  
  delete: async (costCenterId: string): Promise<void> => {
    await api.delete(`/api/cost-centers/${costCenterId}`);
  },
};
