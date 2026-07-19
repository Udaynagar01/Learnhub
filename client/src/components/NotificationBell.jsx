import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BookOpen, MessageSquare, Award, ClipboardCheck, Megaphone } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

const typeIcons = {
  message: MessageSquare,
  enrollment: BookOpen,
  completed: Award,
  quiz: ClipboardCheck,
  course_announcement: Megaphone,
  question: MessageSquare,
  question_answered: MessageSquare,
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = () => {
    if (!user) return;
    api
      .get('/notifications')
      .then((r) => {
        setItems(r.data.data.notifications || []);
        setUnread(r.data.data.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    if (!user) return undefined;
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [user]);

  useSocket(
    user
      ? {
          'notification:new': () => load(),
        }
      : null
  );

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className="absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 backdrop-blur">
                <span className="font-display font-semibold text-slate-900">Notifications</span>
                {unread > 0 && (
                  <button type="button" onClick={markAllRead} className="text-xs font-semibold text-primary-600">
                    Mark all read
                  </button>
                )}
              </div>
              <ul className="max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet</li>
                ) : (
                  items.map((n) => {
                    const Icon = typeIcons[n.type] || Bell;
                    return (
                      <li
                        key={n._id}
                        className={`border-b border-slate-50 px-4 py-3 ${n.read ? '' : 'bg-primary-50/40'}`}
                      >
                        {n.link ? (
                          <Link to={n.link} onClick={() => setOpen(false)} className="flex gap-3 hover:text-primary-600">
                            <div className="rounded-lg bg-primary-100 p-2 text-primary-600">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                              {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
                            </div>
                          </Link>
                        ) : (
                          <div className="flex gap-3">
                            <div className="rounded-lg bg-primary-100 p-2 text-primary-600">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{n.title}</p>
                              {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
