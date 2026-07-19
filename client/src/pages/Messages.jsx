import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useMessageUnread } from '../hooks/useMessageUnread';
import Button from '../components/Button';
import MessageStatus from '../components/MessageStatus';

export default function Messages() {
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const { refresh: refreshUnread } = useMessageUnread();
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [search, setSearch] = useState('');

  const loadConversations = useCallback((q = '') => {
    const params = q.trim() ? { q: q.trim() } : {};
    return api.get('/messages/conversations', { params }).then((r) => setConversations(r.data.data));
  }, []);

  const loadContacts = useCallback((q = '') => {
    const params = q.trim() ? { q: q.trim() } : {};
    return api.get('/messages/contacts', { params }).then((r) => setContacts(r.data.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadConversations(search);
    if (showContacts || (isInstructor && search.trim())) {
        loadContacts(search);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, showContacts, isInstructor, loadConversations, loadContacts]);

  useEffect(() => {
    loadConversations();
    loadContacts();
  }, [loadConversations, loadContacts]);

  const openThread = useCallback(
    async (userId, userMeta) => {
      setActiveId(userId);
      setShowContacts(false);
      setSearch('');
      setSearchParams({ user: userId }, { replace: true });
      const { data } = await api.get(`/messages/with/${userId}`);
      setActiveUser(data.data.user || userMeta);
      setMessages(data.data.messages);
      loadConversations();
      refreshUnread();
    },
    [loadConversations, refreshUnread, setSearchParams]
  );

  useEffect(() => {
    const q = searchParams.get('user');
    if (q && q !== activeId) {
      openThread(q).catch(() => {});
    }
  }, [searchParams, activeId, openThread]);

  useSocket({
    'message:new': (payload) => {
      const from = payload.from?._id?.toString?.() || payload.from?.toString?.();
      if (from === activeId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === payload._id)) return prev;
          return [...prev, payload];
        });
        if (payload._id) {
          api.patch(`/messages/${payload._id}/delivered`).catch(() => {});
        }
      }
      loadConversations(search);
      refreshUnread();
    },
    'message:delivered': ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id?.toString() === messageId && m.status === 'sent' ? { ...m, status: 'delivered' } : m
        )
      );
    },
    'message:read': ({ messageIds }) => {
      const ids = new Set(messageIds || []);
      setMessages((prev) =>
        prev.map((m) => (ids.has(m._id?.toString()) ? { ...m, status: 'read' } : m))
      );
      loadConversations(search);
    },
  });

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    try {
      const { data } = await api.post(`/messages/with/${activeId}`, { text });
      setMessages((prev) => [...prev, data.data]);
      setText('');
      loadConversations();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send message');
    }
  };

  const roleLabel = (role) => {
    if (role === 'instructor') return 'Instructor';
    if (role === 'admin') return 'Support';
    return 'Student';
  };

  const listMode = showContacts || (isInstructor && search.trim().length > 0);

  const sidebarList = useMemo(() => {
    if (listMode) {
      const convIds = new Set(conversations.map((c) => c.user._id.toString()));
      const extra = contacts
        .filter((u) => !convIds.has(u._id.toString()))
        .map((u) => ({
          user: u,
          lastMessage: null,
          unread: 0,
          isContactOnly: true,
        }));
      return [...conversations, ...extra];
    }
    return conversations;
  }, [listMode, contacts, conversations]);

  const emptyHint = listMode
    ? isInstructor
      ? 'No students found. Try another name or email.'
      : 'No contacts found.'
    : 'No conversations yet. Search to start a new chat.';

  return (
    <div>
      <h1 className="section-title">Messages</h1>
      <p className="mt-1 text-sm text-slate-500">
        {isInstructor
          ? 'Real-time chat with your students — Discord-style'
          : 'Chat with instructors in real time'}
      </p>
      <div className="mt-6 flex h-[calc(100vh-12rem)] min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex w-80 shrink-0 flex-col bg-sidebar">
          <div className="space-y-2 border-b border-sidebar-border p-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Chats</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isInstructor ? 'Search students…' : 'Search chats…'}
                className="w-full rounded-xl border-0 bg-sidebar-hover py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary-500/40"
              />
            </div>
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => {
                setShowContacts(!showContacts);
                if (!showContacts) loadContacts(search);
              }}
            >
              {showContacts ? 'Show my chats' : isInstructor ? 'All my students' : 'New message'}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarList.map((item) => {
              const u = item.user;
              const id = u._id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => openThread(id, u)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                    activeId === id ? 'bg-primary-500/20' : 'hover:bg-sidebar-hover'
                  }`}
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-semibold text-white">
                    {u.name?.[0]?.toUpperCase()}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-emerald-400" title="Online" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{u.name}</p>
                    <p className="truncate text-[10px] text-slate-500">
                      {roleLabel(u.role)}
                      {u.email ? ` · ${u.email}` : ''}
                    </p>
                    {item.lastMessage ? (
                      <p className="truncate text-xs text-slate-400">{item.lastMessage}</p>
                    ) : item.isContactOnly ? (
                      <p className="text-xs text-primary-400">Tap to start chat</p>
                    ) : null}
                  </div>
                  {item.unread > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
                      {item.unread > 99 ? '99+' : item.unread}
                    </span>
                  )}
                </button>
              );
            })}
            {sidebarList.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-500">{emptyHint}</p>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col bg-slate-50">
          {activeId ? (
            <>
              <div className="border-b border-slate-200 bg-white px-4 py-3">
                <p className="font-semibold text-slate-900">{activeUser?.name}</p>
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Online
                  {roleLabel(activeUser?.role)}
                  {activeUser?.email ? ` · ${activeUser.email}` : ''}
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => {
                  const fromId = typeof m.from === 'object' ? m.from._id?.toString() : m.from?.toString();
                  const isMine = fromId === user?._id?.toString();
                  return (
                    <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isMine ? 'bg-primary-500 text-white' : 'bg-white text-slate-900 ring-1 ring-slate-100'
                        }`}
                      >
                        <p>{m.text}</p>
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                            isMine ? 'text-white/80' : 'text-gray-400'
                          }`}
                        >
                          <span>
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                          {isMine && <MessageStatus status={m.status} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-4">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  className="input-field flex-1"
                />
                <Button type="submit">Send</Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-gray-500">
              <p>Select a chat or search for a student</p>
              <p className="mt-1 text-xs">✓ sent · ✓✓ delivered · ✓✓ blue seen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
