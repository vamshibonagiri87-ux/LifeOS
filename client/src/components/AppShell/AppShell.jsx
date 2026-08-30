import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { useLifeOSStore } from '../../store/lifeOSStore.js';
import { getSocket } from '../../services/socket.js';
import { NotificationDrawer } from '../NotificationDrawer/NotificationDrawer.jsx';
import {
  LayoutDashboard,
  CheckSquare,
  Cpu,
  Radio,
  FileText,
  Bot,
  History,
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';

export function AppShell() {
  const { user, logout, theme, toggleTheme } = useAuthStore();
  const { unreadCount, toggleDrawer, fetchNotifications, addNotification } = useNotificationStore();
  const { handleProcessingEvent, handleProcessingComplete } = useLifeOSStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchNotifications();

    // Attach Socket.IO real-time listeners
    const socket = getSocket();
    socket.on('PROCESSING_EVENT', (data) => {
      handleProcessingEvent(data);
    });

    socket.on('PROCESSING_COMPLETED', (data) => {
      handleProcessingComplete(data);
    });

    socket.on('NOTIFICATION_RECEIVED', (data) => {
      addNotification(data);
    });

    return () => {
      socket.off('PROCESSING_EVENT');
      socket.off('PROCESSING_COMPLETED');
      socket.off('NOTIFICATION_RECEIVED');
    };
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Responsibilities', path: '/responsibilities', icon: CheckSquare },
    { label: 'Agent Pipeline', path: '/processing', icon: Cpu },
    { label: 'Integrations', path: '/integrations', icon: Radio },
    { label: 'Documents', path: '/documents', icon: FileText },
    { label: 'AI Assistant', path: '/assistant', icon: Bot, highlight: true },
    { label: 'Activity Feed', path: '/activity', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-40 bg-surface/80 backdrop-blur-xl border-r border-border">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight flex items-center gap-1.5">
              LifeOS
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
                AI Core
              </span>
            </h1>
          </div>
        </div>

        {/* Nav list */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600/15 text-primary-400 border border-primary-500/30 font-semibold shadow-sm'
                    : 'text-muted hover:text-foreground hover:bg-surface-hover/60'
                } ${item.highlight ? 'border border-primary-500/20 bg-primary-500/5' : ''}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-400' : 'text-muted'}`} />
                <span className="flex-1">{item.label}</span>
                {item.highlight && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-border">
          <div className="p-3 rounded-xl bg-surface/50 border border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-400 flex items-center justify-center font-bold text-xs shrink-0">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-muted truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-muted hover:text-foreground rounded-lg hover:bg-surface-hover"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-muted">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Agent Ingestion Active</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted hover:text-foreground hover:bg-surface-hover rounded-xl transition"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Notifications Button */}
            <button
              onClick={toggleDrawer}
              className="p-2 relative text-muted hover:text-foreground hover:bg-surface-hover rounded-xl transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Mobile menu modal */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
            <div className="w-64 h-full bg-surface border-r border-border p-4 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h2 className="font-bold text-foreground">LifeOS Navigation</h2>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>
              <div className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-hover"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
              <button
                onClick={logout}
                className="mt-auto flex items-center gap-2 p-3 text-rose-400 hover:bg-rose-500/10 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Page View */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Slide-over Notifications */}
      <NotificationDrawer />
    </div>
  );
}
