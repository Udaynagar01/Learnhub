import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Heart,
  ShoppingBag,
  MessageSquare,
  User,
  Settings,
  LogOut,
  GraduationCap,
  LayoutGrid,
  FileText,
  IndianRupee,
  Megaphone,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMessageUnread } from '../hooks/useMessageUnread';

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/learning', icon: BookOpen, label: 'My Learning' },
  { to: '/dashboard/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/dashboard/orders', icon: ShoppingBag, label: 'My Orders' },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages', badge: true },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

const instructorLinks = [
  { to: '/instructor', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/instructor/courses', icon: BookOpen, label: 'My Courses' },
  { to: '/instructor/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/instructor/students', icon: Users, label: 'Students' },
  { to: '/instructor/messages', icon: MessageSquare, label: 'Messages', badge: true },
  { to: '/instructor/earnings', icon: IndianRupee, label: 'Earnings & Payouts' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: User, label: 'Users' },
  { to: '/admin/instructors', icon: GraduationCap, label: 'Instructors' },
  { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/reviews', icon: MessageSquare, label: 'Reviews' },
  { to: '/admin/categories', icon: LayoutGrid, label: 'Categories' },
  { to: '/admin/pages', icon: FileText, label: 'Site Pages' },
];

export default function DashboardSidebar({ type = 'student' }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unread: messageUnread } = useMessageUnread();
  const links = type === 'admin' ? adminLinks : type === 'instructor' ? instructorLinks : studentLinks;

  const roleLabel =
    type === 'admin' ? 'Admin' : type === 'instructor' ? 'Instructor' : 'Student';

  return (
    <aside className="flex w-[260px] shrink-0 flex-col bg-sidebar">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-display text-lg font-bold text-white">LearnHub</span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-muted">{roleLabel}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const active =
            location.pathname === to ||
            (to !== '/dashboard' && to !== '/instructor' && to !== '/admin' && location.pathname.startsWith(to + '/')) ||
            ((to === '/dashboard' || to === '/instructor' || to === '/admin') && location.pathname === to);
          const count = badge ? messageUnread : 0;
          return (
            <Link
              key={to}
              to={to}
              className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
            >
              <span className="relative">
                <Icon className="h-5 w-5 shrink-0" />
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="m-4 rounded-2xl border border-sidebar-border bg-sidebar-hover p-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
              {user.name?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        </motion.div>
      )}

      <button
        onClick={logout}
        className="mx-4 mb-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>
    </aside>
  );
}
