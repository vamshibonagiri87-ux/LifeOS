import { create } from 'zustand';
import { api } from '../services/api.js';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isDrawerOpen: false,
  loading: false,

  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/notifications');
      const list = res.data.data.notifications || [];
      const unread = list.filter((n) => !n.isRead).length;
      set({ notifications: list, unreadCount: unread, loading: false });
    } catch (err) {
      console.error('[NotificationStore] Failed to fetch:', err);
      set({ loading: false });
    }
  },

  addNotification: (notification) => {
    set((state) => {
      const updated = [notification, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true } : n));
        return {
          notifications: updated,
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      });
    } catch (err) {
      console.error('[NotificationStore] Mark as read error:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('[NotificationStore] Mark all as read error:', err);
    }
  },
}));
