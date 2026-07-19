import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export function useSocket(onEvent) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !onEvent) return;
    const token = localStorage.getItem('accessToken');
    const socket = io('/', { auth: { token } });
    Object.entries(onEvent).forEach(([event, handler]) => {
      if (handler) socket.on(event, handler);
    });
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers passed inline per page
  }, [user]);
}
