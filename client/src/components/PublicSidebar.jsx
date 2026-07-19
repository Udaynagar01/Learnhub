import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  BookOpen,
  Heart,
  MessageSquare,
  Award,
  Users,
  GraduationCap,
  Code,
  Palette,
  Briefcase,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMessageUnread } from '../hooks/useMessageUnread';

const mainLinks = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/dashboard/learning', icon: BookOpen, label: 'My Learning', auth: true },
  { to: '/dashboard/wishlist', icon: Heart, label: 'Wishlist', auth: true },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages', auth: true, badge: true },
  { to: '/dashboard/learning?tab=completed', icon: Award, label: 'Certificates', auth: true },
  { to: '/courses', icon: Users, label: 'Community' },
];

const categoryLinks = [
  { slug: 'development', label: 'Development', icon: Code },
  { slug: 'design', label: 'Design', icon: Palette },
  { slug: 'business', label: 'Business', icon: Briefcase },
  { slug: 'marketing', label: 'Marketing', icon: TrendingUp },
];

export default function PublicSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { unread } = useMessageUnread();
  const progress = 68;

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(to.split('?')[0] + '/');
  };

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col bg-sidebar lg:flex">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="font-display text-xl font-bold tracking-tight text-white">LearnHub</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {mainLinks.map(({ to, icon: Icon, label, auth, badge }) => {
          if (auth && !user) return null;
          const active = isActive(to);
          const count = badge ? unread : 0;
          return (
            <Link
              key={to}
              to={to}
              className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
            >
              <span className="relative">
                <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-primary-300' : ''}`} />
                {count > 0 && (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-500 px-1 text-[9px] font-bold text-white">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}

        <p className="mb-2 mt-8 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Categories
        </p>
        {categoryLinks.map(({ slug, label, icon: Icon }) => (
          <Link
            key={slug}
            to={`/courses?category=${slug}`}
            className="sidebar-link text-[13px]"
          >
            <Icon className="h-4 w-4 shrink-0 text-slate-500" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-sidebar-hover to-sidebar-active p-4 ring-1 ring-primary-500/20"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-primary-300">Keep learning</p>
          <p className="mt-1 text-sm font-semibold text-white">React Masterclass</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-sidebar-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-sidebar-muted">{progress}% complete</p>
          <Link
            to={user ? '/dashboard/learning' : '/login'}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-primary-500 py-2 text-xs font-bold text-white transition hover:bg-primary-600"
          >
            View Progress
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>
    </aside>
  );
}
