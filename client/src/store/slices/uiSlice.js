import { createSlice } from '@reduxjs/toolkit';
import { getStoredTheme } from '../../utils/theme';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: getStoredTheme(),
    notificationsOpen: false,
    sidebarCollapsed: false,
  },
  reducers: {
    setTheme(state, action) {
      const theme = action.payload;
      state.theme = theme;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
    },
    toggleTheme(state) {
      const order = ['light', 'dark', 'system'];
      const idx = order.indexOf(state.theme);
      const next = order[(idx + 1) % order.length];
      state.theme = next;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', next);
      }
    },
    toggleNotifications(state) {
      state.notificationsOpen = !state.notificationsOpen;
    },
    setNotificationsOpen(state, action) {
      state.notificationsOpen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  toggleNotifications,
  setNotificationsOpen,
  toggleSidebar,
} = uiSlice.actions;
export default uiSlice.reducer;
