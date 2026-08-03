import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useSocket(onEvent) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !onEvent) return;

    const token = localStorage.getItem('accessToken');

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
    });

    Object.entries(onEvent).forEach(([event, handler]) => {
      if (handler) socket.on(event, handler);
    });

    return () => socket.disconnect();
  }, [user]);
}