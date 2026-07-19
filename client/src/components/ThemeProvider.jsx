import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { applyTheme, getStoredTheme } from '../utils/theme';

export default function ThemeProvider({ children }) {
  const theme = useSelector((s) => s.ui.theme);

  useEffect(() => {
    applyTheme(theme || getStoredTheme());

    if (theme !== 'system') return undefined;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  return children;
}
