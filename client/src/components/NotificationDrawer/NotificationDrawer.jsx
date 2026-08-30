import React, { useEffect } from 'react';
import { useNotificationStore } from '../../store/notificationStore.js';
import { X, CheckCheck, Bell, AlertTriangle, CheckCircle2, Info, Clock } from 'lucide-react';
import { formatDate } from '../../utils/dates.js';

export function NotificationDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    if (isDrawerOpen) {
      fetchNotifications();
    }
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'URGENT_DEADLINE':
      case 'RESPONSIBILITY_BLOCKED':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'NEW_RESPONSIBILITY':
        return <CheckCircle2 className="w-5 h-5 text-primary-400" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">Notifications</h3>
                <p className="text-xs text-muted">
                  {unreadCount > 0 ? `${unreadCount} unread alert(s)` : 'All caught up'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-xs text-muted hover:text-foreground hover:bg-surface-hover rounded-md flex items-center gap-1 transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                </button>
              )}
              <button
                onClick={closeDrawer}
                className="p-1.5 text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-muted">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id || notif.id}
                  onClick={() => !notif.isRead && markAsRead(notif._id || notif.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    notif.isRead
                      ? 'bg-surface/50 border-border/60 opacity-70'
                      : 'bg-surface-hover/80 border-primary-500/30 glow-primary'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{notif.message}</p>
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-muted">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(notif.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
