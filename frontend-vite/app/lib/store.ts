import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { User } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user: User, token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  updateUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));

// Initialize auth state from localStorage
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      useAuthStore.setState({ user, token, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }
}

interface StationState {
  stations: any[];
  selectedStation: any | null;
  setStations: (stations: any[]) => void;
  setSelectedStation: (station: any) => void;
}

export const useStationStore = create<StationState>((set) => ({
  stations: [],
  selectedStation: null,
  setStations: (stations) => set({ stations }),
  setSelectedStation: (station) => set({ selectedStation: station }),
}));

interface WebSocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  notifications: any[];
  connect: (token: string) => void;
  disconnect: () => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  notifications: [],
  connect: (token: string) => {
    const wsUrl = process.env.NODE_ENV === 'production'
      ? `wss://${window.location.host}/ws`
      : 'ws://localhost:8080/ws';
    
    const socket = new WebSocket(`${wsUrl}?token=${token}`);
    
    socket.onopen = () => {
      set({ socket, isConnected: true });
    };
    
    socket.onclose = () => {
      set({ socket: null, isConnected: false });
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'command' || data.type === 'alert') {
        get().addNotification(data);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({ socket: null, isConnected: false });
  },
  addNotification: (notification) => {
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id: Date.now().toString() }]
    }));
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },
}));
