import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from './useSocket';

export function useMessageUnread() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    if (!user) return;
    api
      .get('/messages/unread-count')
      .then((r) => setUnread(r.data.data.unread || 0))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useSocket(
    user
      ? {
          'message:new': () => load(),
          'message:read': () => load(),
        }
      : null
  );

  return { unread, refresh: load };
}
