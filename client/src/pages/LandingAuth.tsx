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
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-pink-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="relative z-20 px-4 sm:px-6 py-4 border-b border-white/10 backdrop-blur-md bg-slate-950/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg sm:text-xl font-extrabold text-white tracking-tight">1-4-7</span>
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
                  Rule
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">Smart Revision Guide</p>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn btn-secondary btn-sm flex items-center gap-2 border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            <span className="font-medium text-xs sm:text-sm">Instant Demo Login</span>
          </button>
        </div>
      </header>

      {/* Hero & Auth Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:py-12 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center flex-1 w-full">
        {/* Left Column: Product Value & 1-4-7 Rule Diagram */}
        <div className="lg:col-span-7 space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-transparent px-3.5 py-1.5 text-xs font-semibold text-indigo-300 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            <span>Spaced Repetition & University Revision System</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] font-display">
              Remember Everything <br />
              With The <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">1-4-7 Rule</span>
            </h1>
            <p className="text-sm sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
              When you learn a unit on Day 1, the system automatically schedules and reminds you for <strong>Revise #1 on Day 4</strong> and <strong>Revise #2 on Day 7</strong> to lock it into permanent recall.
            </p>
          </div>

          {/* Core 1-4-7 Visual Stepper */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
              <span>Scientific Revision Timeline</span>
              <span className="text-indigo-400">Ebbinghaus Curve</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Day 1 */}
              <div className="relative rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/15 to-slate-900/80 p-4 space-y-2 backdrop-blur-sm group hover:border-blue-500/50 transition">
                <div className="flex items-center justify-between">
                  <span className="badge badge-day1 text-[11px] font-bold">DAY 1</span>
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Initial Study</h4>
                  <p className="text-xs text-blue-200/80 leading-relaxed mt-1">
                    Learn topics, take active notes & solve derivations.
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-between border-t border-blue-500/20 text-[11px]">
                  <span className="font-semibold text-blue-300">Phase: Learn</span>
                  <span className="text-blue-400/80 font-mono">Day 0</span>
                </div>
              </div>

              {/* Day 4 */}
              <div className="relative rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/15 to-slate-900/80 p-4 space-y-2 backdrop-blur-sm group hover:border-purple-500/50 transition">
                <div className="flex items-center justify-between">
                  <span className="badge badge-day4 text-[11px] font-bold">DAY 4</span>
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Revise #1</h4>
                  <p className="text-xs text-purple-200/80 leading-relaxed mt-1">
                    Active recall testing & note recap before forgetting kicks in.
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-between border-t border-purple-500/20 text-[11px]">
                  <span className="font-semibold text-purple-300">+3 Days</span>
                  <span className="text-purple-400/80 font-mono">Day 4</span>
                </div>
              </div>

              {/* Day 7 */}
              <div className="relative rounded-2xl border border-pink-500/30 bg-gradient-to-b from-pink-500/15 to-slate-900/80 p-4 space-y-2 backdrop-blur-sm group hover:border-pink-500/50 transition">
                <div className="flex items-center justify-between">
                  <span className="badge badge-day7 text-[11px] font-bold">DAY 7</span>
                  <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Revise #2</h4>
                  <p className="text-xs text-pink-200/80 leading-relaxed mt-1">
                    Final spaced review to achieve exam-ready permanent mastery.
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-between border-t border-pink-500/20 text-[11px]">
                  <span className="font-semibold text-pink-300">+6 Days Total</span>
                  <span className="text-pink-400/80 font-mono">Mastery 🏆</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof & Features */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 text-xs text-slate-300 border-t border-white/10">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Zero Forgotten Units</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>Daily Study Streaks</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" />
              <span>Automatic Overdue Tracking</span>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Auth Card */}
        <div className="lg:col-span-5 w-full">
          <div className="relative rounded-3xl border border-white/15 bg-slate-900/85 p-6 sm:p-8 space-y-6 max-w-md mx-auto w-full shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
            {/* Quick Demo Login Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Instant Experience</span>
                </p>
                <p className="text-[11px] text-indigo-200/80">Pre-loaded with sample subjects & syllabus</p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="btn btn-primary btn-sm text-xs py-2 px-3 shadow-md shadow-indigo-600/30"
              >
                1-Click Demo
              </button>
            </div>

            {/* Login / Register Toggle */}
            <div className="flex items-center rounded-2xl bg-slate-950/80 p-1.5 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(true);
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  isLoginTab
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-white'
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
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  !isLoginTab
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {!isLoginTab && (
                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field pl-10 text-sm py-2.5 bg-slate-950/70 border-white/10 rounded-xl"
                      required={!isLoginTab}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 text-sm py-2.5 bg-slate-950/70 border-white/10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 text-sm py-2.5 bg-slate-950/70 border-white/10 rounded-xl"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 mt-3 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-lg shadow-indigo-600/30"
              >
                <span>{loading ? 'Processing...' : isLoginTab ? 'Enter Study Dashboard' : 'Start 1-4-7 Journey'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="text-center text-[11px] text-slate-400 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5">
              <span>Demo account:</span>
              <code className="text-indigo-300 font-mono">demo@studyassist.com</code>
              <span>/</span>
              <code className="text-indigo-300 font-mono">study123</code>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-5 px-4 text-center text-xs text-slate-400 bg-slate-950/40">
        <p>1-4-7 Smart Study Guide — Spaced repetition and syllabus mastery system.</p>
      </footer>
    </div>
  );
};
