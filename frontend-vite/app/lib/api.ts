import axios from 'axios';

// API base configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/v1/api/radar-hub-manager' 
  : 'http://localhost:8998/v1/api/radar-hub-manager';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Types
export interface User {
  id: number;
  username: string;
  full_name: string;
  role_id: 'ADMIN' | 'OPERATOR' | 'HQ';
  station_id?: number;
  station?: Station;
  created_at: number;
  updated_at: number;
  last_login: number;
}

export interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  distance_to_coast?: number;
  status: string;
  note?: string;
  created_at: number;
  updated_at: number;
}

export interface Schedule {
  id: number;
  station_id: number;
  start_hhmm: string;
  end_hhmm: string;
  commander?: string;
  crew?: string;
  phone?: string;
  created_at: number;
  updated_at: number;
}

export interface Command {
  id: number;
  content: string;
  from_user_id: string;
  to_station_id: number;
  sent_at: number;
  acknowledged_at?: number;
  created_at: number;
}

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
};

// Stations API
export const stationsAPI = {
  getAll: () =>
    api.get('/stations'),
  
  getById: (id: number) =>
    api.get(`/stations/${id}`),
  
  create: (data: Omit<Station, 'id' | 'created_at' | 'updated_at'>) =>
    api.post('/stations', data),
  
  update: (id: number, data: Partial<Station>) =>
    api.put(`/stations/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/stations/${id}`),
};

// Users API
export const usersAPI = {
  getAll: () =>
    api.get('/users'),
  
  getByUsername: (username: string) =>
    api.get(`/users/${username}`),
  
  create: (data: {
    username: string;
    password: string;
    full_name: string;
    role_id: 'ADMIN' | 'OPERATOR' | 'HQ';
    station_id?: number;
  }) =>
    api.post('/users', data),
  
  update: (username: string, data: Partial<User>) =>
    api.put(`/users/${username}`, data),
  
  delete: (username: string) =>
    api.delete(`/users/${username}`),
};

// Schedules API
export const schedulesAPI = {
  getByStation: (stationId: number) =>
    api.get(`/station-schedules/station/${stationId}`),
  
  getById: (stationId: number, scheduleId: number) =>
    api.get(`/station-schedules/station/${stationId}/${scheduleId}`),
  
  create: (stationId: number, data: {
    start_hhmm: string;
    end_hhmm: string;
    commander?: string;
    crew?: string;
    phone?: string;
  }) =>
    api.post(`/station-schedules/station/${stationId}`, data),
  
  update: (stationId: number, scheduleId: number, data: Partial<Schedule>) =>
    api.put(`/station-schedules/station/${stationId}/${scheduleId}`, data),
  
  delete: (stationId: number, scheduleId: number) =>
    api.delete(`/station-schedules/station/${stationId}/${scheduleId}`),
};

// Commands API
export const commandsAPI = {
  getAll: (stationId?: number) =>
    api.get('/commands', { params: stationId ? { station_id: stationId } : {} }),
  
  getById: (id: number) =>
    api.get(`/commands/${id}`),
  
  create: (data: {
    content: string;
    to_station_id: number;
  }) =>
    api.post('/commands', data),
  
  acknowledge: (id: number) =>
    api.put(`/commands/${id}/acknowledge`),
  
  getUnacknowledged: (stationId: number) =>
    api.get(`/station-commands/station/${stationId}/unacknowledged`),
};
