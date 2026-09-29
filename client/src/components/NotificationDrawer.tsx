import React, { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api/client';
import { NotificationItem } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRevision?: (revisionId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectRevision
}) => {
  if (!isOpen) return null;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const loadNotifications = () => {
    api.notifications.list().then((res) => {
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    });
  };

  useEffect(() => {
    loadNotifications();
  }, [isOpen]);

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        new Notification('1-4-7 Smart Study Guide', {
          body: '🎉 Spaced revision notifications are enabled! You will be reminded on Day 4 and Day 7.',
          icon: '/favicon.svg'
        });
        api.settings.update({ browser_notifications_enabled: 1 });
      }
    }
  };

  const handleMarkRead = async (id: string) => {
    await api.notifications.markRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await api.notifications.markAllRead();
    loadNotifications();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-white/10 text-slate-100 flex flex-col shadow-2xl">
          {/* Drawer Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Notifications & Reminders</h3>
                <p className="text-[11px] text-slate-400">1-4-7 Spaced Repetition Alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Browser Notification Banner */}
          {browserPermission !== 'granted' && (
            <div className="p-3 bg-indigo-950/40 border-b border-indigo-500/20 text-xs text-indigo-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Enable browser push reminders for Day 4 & Day 7</span>
              </div>
              <button
                onClick={requestNotificationPermission}
                className="btn btn-primary btn-sm text-[11px] py-1 px-2.5 shrink-0"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No notifications yet.</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Complete Day 1 of any unit to queue Day 4 and Day 7 reminders.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isOverdue = notif.notification_type === 'overdue_reminder';
                const isDay4 = notif.notification_type === 'day_4_reminder';

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) handleMarkRead(notif.id);
                      if (notif.revision_session_id && onSelectRevision) {
                        onSelectRevision(notif.revision_session_id);
                        onClose();
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      notif.is_read
                        ? 'bg-slate-900/40 border-white/5 opacity-80'
                        : isOverdue
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-100 shadow-sm'
                        : isDay4
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-100 shadow-sm'
                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        {isOverdue ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-purple-400" />
                        )}
                        <span>{notif.title}</span>
                      </div>

                      {!notif.is_read && (
                        <span className="h-2 w-2 rounded-full bg-pink-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-white/5">
                      <span>Scheduled for {notif.scheduled_date} at {notif.scheduled_time}</span>
                      {notif.revision_session_id && (
                        <span className="font-semibold text-indigo-400 hover:underline">
                          Revise Now →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
