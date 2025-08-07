export type RoleName = 'ADMIN' | 'OPERATOR' | 'HQ';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role_id: RoleName;
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
  from_user_id: string;
  to_station_id: number;
  content: string;
  created_at: number;
  sent_at: number;
  acknowledged_at?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  full_name: string;
  role_id: RoleName;
  station_id?: number;
}

export interface UpdateUserRequest {
  full_name?: string;
  password?: string;
  role_id?: RoleName;
  station_id?: number;
}

export interface CreateStationRequest {
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  distance_to_coast?: number;
  status?: string;
  note?: string;
}

export interface UpdateStationRequest {
  name?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  distance_to_coast?: number;
  status?: string;
  note?: string;
}

export interface CreateCommandRequest {
  to_station_id: number;
  content: string;
}

export interface ErrorResponse {
  error: string;
}
