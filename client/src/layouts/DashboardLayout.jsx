import { motion } from 'framer-motion';
import DashboardSidebar from '../components/DashboardSidebar';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

export default function DashboardLayout({ type = 'student' }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar type={type} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-display text-xl font-bold text-slate-900 dark:text-white"
            >
              Welcome back, {user?.name?.split(' ')[0] || 'there'}!
            </motion.h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <PageTransition />
        </main>
      </div>
    </div>
  );
}
