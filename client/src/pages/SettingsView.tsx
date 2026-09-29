import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Clock,
  Globe,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { api } from '../api/client';
import { User, UserSettings } from '../types';

interface SettingsViewProps {
  user: User | null;
  settings: UserSettings | null;
  onRefreshSettings: () => void;
  onResetDemo: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  settings,
  onRefreshSettings,
  onResetDemo
}) => {
  const [reminderTime, setReminderTime] = useState(settings?.reminder_time || '19:00');
  const [browserNotifications, setBrowserNotifications] = useState(
    settings?.browser_notifications_enabled === 1
  );
  const [emailNotifications, setEmailNotifications] = useState(
    settings?.email_notifications_enabled === 1
  );
  const [dailyDigest, setDailyDigest] = useState(
    settings?.daily_digest_enabled === 1
  );
  const [timezone, setTimezone] = useState(
    settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (settings) {
      setReminderTime(settings.reminder_time || '19:00');
      setBrowserNotifications(settings.browser_notifications_enabled === 1);
      setEmailNotifications(settings.email_notifications_enabled === 1);
      setDailyDigest(settings.daily_digest_enabled === 1);
      setTimezone(settings.timezone || 'Asia/Kolkata');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.settings.update({
        reminder_time: reminderTime,
        browser_notifications_enabled: browserNotifications ? 1 : 0,
        email_notifications_enabled: emailNotifications ? 1 : 0,
        daily_digest_enabled: dailyDigest ? 1 : 0,
        timezone
      });
      setSaveSuccess(true);
      onRefreshSettings();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        new Notification('1-4-7 Smart Study Guide', {
          body: 'Reminders enabled! You will be notified on Day 4 and Day 7.',
          icon: '/favicon.svg'
        });
        setBrowserNotifications(true);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-400" />
          <span>Notification & Study Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure daily reminder alerts, notification channels, and spaced repetition preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Reminder Time Configuration (Requirement 8 & 9) */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Clock className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Daily Revision Reminder Time</h3>
              <p className="text-xs text-slate-400">
                Default time when Day 4 and Day 7 revision reminders will be dispatched.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Preferred Reminder Time (Default: 7:00 PM)
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="input-field text-sm py-2"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Current selection: {reminderTime} (24-hour format)
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-indigo-400" />
                <span>Your Timezone</span>
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="input-field text-xs py-2"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Dates and calendar days are calculated in your local timezone.
              </p>
            </div>
          </div>
        </div>

        {/* Notification Channels (Requirement 9) */}
        <div className="glass-panel p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Bell className="h-5 w-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-white">Notification Channels</h3>
              <p className="text-xs text-slate-400">
                Choose how you would like to be alerted for Day 4 and Day 7 revisions.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* In-app notification */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-white/5">
              <div>
                <span className="font-bold text-white block">In-App Notification Bell</span>
                <span className="text-[11px] text-slate-400">
                  Real-time alerts in the top bar bell counter when revisions become due.
                </span>
              </div>
              <span className="badge badge-mastered text-[10px]">Always Active</span>
            </div>

            {/* Browser push notifications */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-white/5">
              <div className="space-y-0.5">
                <span className="font-bold text-white block">Browser Desktop Notifications</span>
                <span className="text-[11px] text-slate-400">
                  Receive browser push banners even when the tab is not in focus.
                </span>
                {browserPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleRequestBrowserPermission}
                    className="text-[11px] text-indigo-400 hover:underline block pt-1"
                  >
                    Click to request browser permission →
                  </button>
                )}
              </div>
              <input
                type="checkbox"
                checked={browserNotifications}
                onChange={(e) => setBrowserNotifications(e.target.checked)}
                className="h-5 w-5 rounded bg-slate-800 border-white/20 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* Email notifications (Architecture ready) */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Email Digest & Morning Roadmap</span>
                  <span className="badge badge-primary text-[9px]">Architecture Ready</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Send morning digest of today's revisions to {user?.email || 'your email'}.
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-5 w-5 rounded bg-slate-800 border-white/20 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 1-4-7 Algorithm Reference Card */}
        <div className="glass-panel p-6 space-y-3 text-xs border-indigo-500/20 bg-indigo-950/20">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <Sparkles className="h-4 w-4" />
            <span>1-4-7 Spaced Revision Algorithm Principles</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            The core algorithm strictly enforces spaced repetition:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><strong>Day 1:</strong> Initial Study (Learn)</li>
            <li><strong>Day 4:</strong> First Revision = Initial Study Date + 3 calendar days (Interrupts forgetting curve)</li>
            <li><strong>Day 7:</strong> Second Revision = Initial Study Date + 6 calendar days (Consolidates long-term memory)</li>
            <li><strong>Mastery:</strong> When all 3 sessions are completed, unit status upgrades to 🏆 MASTERED.</li>
            <li><strong>Late revisions:</strong> If a revision is completed past due date, the record marks days late without deleting history.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onResetDemo}
            className="btn btn-secondary text-xs flex items-center gap-1.5 text-amber-300 hover:bg-amber-500/10 w-full sm:w-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo Data (Regional Economics)</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className={`btn btn-primary text-xs py-2.5 px-6 flex items-center justify-center gap-1.5 w-full sm:w-auto ${
              saveSuccess ? 'bg-emerald-600 border-emerald-500' : ''
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Preferences Saved!</span>
              </>
            ) : (
              <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
