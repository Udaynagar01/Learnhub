export const THEMES = ['light', 'dark', 'system'];

export function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = resolved;
}

export function getStoredTheme() {
  if (typeof localStorage === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  return THEMES.includes(stored) ? stored : 'light';
}
