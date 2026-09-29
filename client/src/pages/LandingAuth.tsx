import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Flame,
  Award
} from 'lucide-react';
import { api, setStoredToken } from '../api/client';
import { User, UserSettings } from '../types';

interface LandingAuthProps {
  onAuthSuccess: (user: User, settings: UserSettings) => void;
}

export const LandingAuth: React.FC<LandingAuthProps> = ({ onAuthSuccess }) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.auth.login({
        email: 'demo@studyassist.com',
        password: 'study123'
      });
      setStoredToken(res.token);
      onAuthSuccess(res.user, res.settings);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      if (isLoginTab) {
        const res = await api.auth.login({ email, password });
        setStoredToken(res.token);
        onAuthSuccess(res.user, res.settings);
      } else {
        const res = await api.auth.register({ name, email, password });
        setStoredToken(res.token);
        // fetch me
        const me = await api.auth.me();
        onAuthSuccess(me.user, me.settings);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 shadow-lg shadow-indigo-500/30">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-lg font-bold text-white tracking-tight">1-4-7</span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                Rule
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Smart Study Guide</p>
          </div>
        </div>

        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Instant Demo Login</span>
        </button>
      </header>

      {/* Hero & Auth Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        {/* Left Column: Product Value & 1-4-7 Rule Diagram */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Spaced Repetition & University Revision System</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-display">
              Remember Everything <br />
              With The <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">1-4-7 Rule</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              When you study a unit on Day 1, the system automatically schedules and reminds you for <strong>Revise #1 on Day 4</strong> and <strong>Revise #2 on Day 7</strong> to lock it into permanent memory.
            </p>
          </div>

          {/* Core 1-4-7 Visual Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="badge badge-day1 text-xs font-bold">DAY 1</span>
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
              <h4 className="text-base font-bold text-white">Initial Study</h4>
              <p className="text-xs text-blue-200/80">
                Learn topics, take active notes & solve derivations.
              </p>
              <div className="text-[11px] font-mono text-blue-300 pt-1">Learn</div>
            </div>

            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="badge badge-day4 text-xs font-bold">DAY 4</span>
                <Calendar className="h-4 w-4 text-purple-400" />
              </div>
              <h4 className="text-base font-bold text-white">Revise #1</h4>
              <p className="text-xs text-purple-200/80">
                Study Date + 3 days. Active recall test & notes recap.
              </p>
              <div className="text-[11px] font-mono text-purple-300 pt-1">+3 Calendar Days</div>
            </div>

            <div className="rounded-2xl border border-pink-500/30 bg-pink-500/10 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="badge badge-day7 text-xs font-bold">DAY 7</span>
                <Award className="h-4 w-4 text-pink-400" />
              </div>
              <h4 className="text-base font-bold text-white">Revise #2</h4>
              <p className="text-xs text-pink-200/80">
                Study Date + 6 days. Final spaced revision to master.
              </p>
              <div className="text-[11px] font-mono text-pink-300 pt-1">+6 Calendar Days 🏆</div>
            </div>
          </div>

          {/* Social Proof & Features */}
          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-400 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Zero Forgotton Units</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>Daily Study Streaks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-400" />
              <span>Calendar & Overdue Tracking</span>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Card */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 sm:p-8 space-y-6 max-w-md mx-auto w-full shadow-2xl border border-white/15">
            {/* Quick Demo Login Banner */}
            <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">Quick Review Demo</p>
                <p className="text-[11px] text-indigo-300">Prefilled with Regional Economics</p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="btn btn-primary btn-sm text-xs"
              >
                1-Click Demo
              </button>
            </div>

            {/* Login / Register Toggle */}
            <div className="flex items-center rounded-xl bg-slate-950/60 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(true);
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  isLoginTab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(false);
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  !isLoginTab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {!isLoginTab && (
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Your Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field pl-9 text-sm"
                      required={!isLoginTab}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-9 text-sm"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Processing...' : isLoginTab ? 'Enter Study Dashboard' : 'Start 1-4-7 Journey'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-white/5">
              <span>Demo account: <code>demo@studyassist.com</code> / <code>study123</code></span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-slate-500">
        <p>1-4-7 Smart Study Guide — Based on the Ebbinghaus Spaced Revision Methodology.</p>
      </footer>
    </div>
  );
};
