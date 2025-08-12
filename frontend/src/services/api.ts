import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create an Axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    // If the response has data with success: false, treat it as an error
    if (response.data && response.data.success === false) {
      return Promise.reject(response.data.error || 'An error occurred');
    }
    return response.data?.data || response.data;
  },
  (error: AxiosError<ApiResponse<any>>) => {
    // Handle 401 Unauthorized errors (token expired, invalid, etc.)
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Return error message from API or default error message
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    
    return Promise.reject(errorMessage);
  }
);

// API methods
export const auth = {
  login: (credentials: { email: string; password: string }) =>
    api.post<{ user: any; token: string }>('/auth/login', credentials),
  
  register: (userData: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string 
  }) => api.post<{ user: any; token: string }>('/auth/register', userData),
  
  getMe: () => api.get('/auth/me'),
  
  updateProfile: (userData: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    currentPassword: string;
    newPassword: string;
  }>) => api.patch('/auth/me', userData),
};

export const tasks = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (taskData: any) => api.post('/tasks', taskData),
  update: (id: string, taskData: any) => api.patch(`/tasks/${id}`, taskData),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

export const timeEntries = {
  getAll: (params?: any) => api.get('/time-entries', { params }),
  getById: (id: string) => api.get(`/time-entries/${id}`),
  create: (entryData: any) => api.post('/time-entries', entryData),
  update: (id: string, entryData: any) => api.patch(`/time-entries/${id}`, entryData),
  delete: (id: string) => api.delete(`/time-entries/${id}`),
  startTimer: (taskId: string) => api.post('/time-entries/start', { taskId }),
  stopTimer: (entryId: string) => api.post(`/time-entries/${entryId}/stop`),
};

export const timesheets = {
  getAll: (params?: any) => api.get('/timesheets', { params }),
  getById: (id: string) => api.get(`/timesheets/${id}`),
  create: (timesheetData: any) => api.post('/timesheets', timesheetData),
  update: (id: string, timesheetData: any) => 
    api.patch(`/timesheets/${id}`, timesheetData),
  delete: (id: string) => api.delete(`/timesheets/${id}`),
  submit: (id: string) => api.post(`/timesheets/${id}/submit`),
  approve: (id: string) => api.post(`/timesheets/${id}/approve`),
  reject: (id: string, reason: string) => 
    api.post(`/timesheets/${id}/reject`, { reason }),
};

export const invoices = {
  getAll: (params?: any) => api.get('/invoices', { params }),
  getById: (id: string) => api.get(`/invoices/${id}`),
  create: (invoiceData: any) => api.post('/invoices', invoiceData),
  update: (id: string, invoiceData: any) => 
    api.patch(`/invoices/${id}`, invoiceData),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  send: (id: string) => api.post(`/invoices/${id}/send`),
  markAsPaid: (id: string) => api.post(`/invoices/${id}/mark-as-paid`),
  generatePdf: (id: string) => api.get(`/invoices/${id}/pdf`, { 
    responseType: 'blob' 
  }),
};

export const clients = {
  getAll: (params?: any) => api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (clientData: any) => api.post('/clients', clientData),
  update: (id: string, clientData: any) => 
    api.patch(`/clients/${id}`, clientData),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

export default {
  auth,
  tasks,
  timeEntries,
  timesheets,
  invoices,
  clients,
};
