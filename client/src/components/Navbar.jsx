import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ShoppingCart, ChevronDown, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

const navMenus = [
  {
    label: 'LearnHub',
    items: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    label: 'Categories',
    items: [
      { label: 'Development', to: '/courses?category=development' },
      { label: 'Design', to: '/courses?category=design' },
      { label: 'Business', to: '/courses?category=business' },
      { label: 'Marketing', to: '/courses?category=marketing' },
    ],
  },
  {
    label: 'Courses',
    items: [
      { label: 'All Courses', to: '/courses' },
      { label: 'Free Courses', to: '/courses?price=free' },
      { label: 'Bestsellers', to: '/courses?sort=popular' },
    ],
  },
  {
    label: 'Instructors',
    items: [
      { label: 'Top Instructors', to: '/courses' },
      { label: 'Become Instructor', to: '/become-instructor' },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Discussions', to: '/courses' },
      { label: 'Messages', to: '/dashboard/messages' },
      { label: 'Verify Certificate', to: '/verify-certificate' },
    ],
  },
];

function NavDropdown({ label, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="nav-link flex items-center gap-1 py-2"
        onClick={() => setOpen(!open)}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute left-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-float dark:border-slate-700 dark:bg-slate-900"
        >
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block px-4 py-2.5 text-sm text-slate-600 transition duration-200 hover:translate-x-1 hover:bg-primary-50 hover:text-primary-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-primary-400"
            >
              {item.label}
            </Link>
          ))}
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { user, cart } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const dashboardPath =
    user?.role === 'admin' ? '/admin' : user?.role === 'instructor' ? '/instructor' : '/dashboard';

  const handleSearch = (e) => {
    e?.preventDefault?.();
    if (query.trim()) navigate(`/courses?q=${encodeURIComponent(query.trim())}`);
    else navigate('/courses');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <Link to="/" className="flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 transition duration-300 hover:rotate-3 hover:scale-105">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-primary-600">LearnHub</span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {navMenus.map((menu) => (
            <NavDropdown key={menu.label} {...menu} />
          ))}
        </nav>

        <form onSubmit={handleSearch} className="mx-auto hidden max-w-xl flex-1 md:block lg:max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for courses, skills, or instructors..."
              className="search-bar"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {user && <NotificationBell />}
          <Link
            to="/checkout"
            className="relative rounded-xl p-2.5 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800"
          >
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="animate-pulse-soft absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white">
                {cart.length}
              </span>
            )}
          </Link>

          {user ? (
            <Link to={dashboardPath} className="flex items-center gap-2 rounded-xl p-1 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 dark:hover:bg-slate-800">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white ring-2 ring-primary-100 transition duration-300 hover:scale-105 hover:ring-primary-300">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  user.name?.charAt(0)
                )}
              </div>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:text-primary-600 sm:block">
                Log in
              </Link>
              <Link to="/register" className="btn-primary px-4 py-2 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
