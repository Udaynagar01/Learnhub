import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Moon, Sun } from 'lucide-react';
import { setTheme } from '../store/slices/uiSlice';
import { resolveTheme } from '../utils/theme';

export default function ThemeToggle({ className = '' }) {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const sync = () => setIsDark(resolveTheme(theme) === 'dark');
    sync();
    if (theme !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [theme]);

  const cycle = () => {
    const order = ['light', 'dark', 'system'];
    const idx = order.indexOf(theme);
    dispatch(setTheme(order[(idx + 1) % order.length]));
  };

  const label =
    theme === 'light' ? 'Light mode' : theme === 'dark' ? 'Dark mode' : 'System theme';

  return (
    <button
      type="button"
      onClick={cycle}
      className={`rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-primary-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-primary-400 ${className}`}
      title={`${label} — click to change`}
      aria-label={`Theme: ${label}. Click to change.`}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
