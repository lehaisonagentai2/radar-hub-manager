import axios from 'axios';
import { 
  LoginRequest, 
  LoginResponse, 
  User, 
  Station, 
  CreateUserRequest, 
  UpdateUserRequest,
  CreateStationRequest,
  UpdateStationRequest,
  Schedule,
  Command,
  CreateCommandRequest
} from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/v1/api/radar-hub-manager';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
    if (this.token) {
      this.setAuthHeader();
    }
  }

  private setAuthHeader() {
    if (this.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  private removeAuthHeader() {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    this.token = response.data.token;
    localStorage.setItem('token', this.token!);
    this.setAuthHeader();
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/auth/me`);
    return response.data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    this.removeAuthHeader();
  }

  // User management (Admin only)
  async getUsers(): Promise<User[]> {
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/users`, userData);
    return response.data;
  }

  async updateUser(userId: number, userData: UpdateUserRequest): Promise<User> {
    const response = await axios.put(`${API_BASE_URL}/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/users/${userId}`);
  }

  // Station management (Admin only)
  async getStations(): Promise<Station[]> {
    const response = await axios.get(`${API_BASE_URL}/stations`);
    return response.data;
  }

  async createStation(stationData: CreateStationRequest): Promise<Station> {
    const response = await axios.post(`${API_BASE_URL}/stations`, stationData);
    return response.data;
  }

  async updateStation(stationId: number, stationData: UpdateStationRequest): Promise<Station> {
    const response = await axios.put(`${API_BASE_URL}/stations/${stationId}`, stationData);
    return response.data;
  }

  async deleteStation(stationId: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/stations/${stationId}`);
  }

  // Schedule management
  async getSchedules(date?: string): Promise<Schedule[]> {
    const params = date ? { date } : {};
    const response = await axios.get(`${API_BASE_URL}/schedules`, { params });
    return response.data;
  }

  // Command management
  async getCommands(stationId?: number): Promise<Command[]> {
    const params = stationId ? { station_id: stationId } : {};
    const response = await axios.get(`${API_BASE_URL}/commands`, { params });
    return response.data;
  }

  async createCommand(commandData: CreateCommandRequest): Promise<Command> {
    const response = await axios.post(`${API_BASE_URL}/commands`, commandData);
    return response.data;
  }

  async acknowledgeCommand(commandId: number): Promise<void> {
    await axios.put(`${API_BASE_URL}/commands/${commandId}/acknowledge`);
  }
}

export const apiClient = new ApiClient();
