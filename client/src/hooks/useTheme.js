import { useDispatch, useSelector } from 'react-redux';
import { setTheme, toggleTheme } from '../store/slices/uiSlice';
import { resolveTheme } from '../utils/theme';

/** Theme state + actions (light | dark | system) */
export function useTheme() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const resolved = typeof window !== 'undefined' ? resolveTheme(theme) : 'light';

  return {
    theme,
    resolved,
    isDark: resolved === 'dark',
    setTheme: (value) => dispatch(setTheme(value)),
    toggleTheme: () => dispatch(toggleTheme()),
  };
}
