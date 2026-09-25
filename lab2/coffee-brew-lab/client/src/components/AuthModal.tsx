import React, { useState, useEffect } from 'react';
import { X, Shield, Coffee, Eye, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requestPasswordReset } from '../api/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'quick' | 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'quick',
}) => {
  const { login, register, switchPersona, user } = useAuth();
  const [tab, setTab] = useState<'quick' | 'login' | 'register' | 'forgot'>(defaultTab);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registerRole, setRegisterRole] = useState<'Taster' | 'Barista'>('Barista');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setTab(defaultTab);
    setError(null);
    setSuccessMessage(null);
  }, [defaultTab, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(email, password, name, registerRole);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const msg = await requestPasswordReset(email);
      setSuccessMessage(msg || 'Password reset link sent! Check Mailpit inbox at port 8025.');
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (persona: 'Admin' | 'Barista' | 'Taster') => {
    setLoading(true);
    setError(null);
    try {
      await switchPersona(persona);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Persona switch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-full mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {tab === 'quick' && 'Switch Demo Role'}
            {tab === 'login' && 'Sign In to BrewLab'}
            {tab === 'register' && 'Create an Account'}
            {tab === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            JWT 15m Access Token & 7d Refresh Token with Session Audit
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 mb-6 gap-2">
          <button
            type="button"
            onClick={() => { setTab('quick'); setError(null); }}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
              tab === 'quick'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ⚡ Quick Demo
          </button>
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
              tab === 'login'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
              tab === 'register'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Quick Switcher */}
        {tab === 'quick' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 mb-2">
              Select any pre-configured role to immediately test RBAC capabilities:
            </p>

            {/* Admin Persona */}
            <button
              onClick={() => handleQuickSwitch('Admin')}
              disabled={loading}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-start justify-between group ${
                user?.role === 'Admin'
                  ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40'
                  : 'bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-white text-sm">Head Roaster (Admin)</span>
                  {user?.role === 'Admin' && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Full permissions: manage all recipes, inspect audit logs, and revoke any user session.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all mt-1" />
            </button>

            {/* Barista Persona */}
            <button
              onClick={() => handleQuickSwitch('Barista')}
              disabled={loading}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-start justify-between group ${
                user?.role === 'Barista'
                  ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40'
                  : 'bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white text-sm">James Hoffmann (Barista)</span>
                  {user?.role === 'Barista' && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Brewmaster permissions: create recipes, upload photos to S3, edit/delete own recipes.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all mt-1" />
            </button>

            {/* Taster Persona */}
            <button
              onClick={() => handleQuickSwitch('Taster')}
              disabled={loading}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-start justify-between group ${
                user?.role === 'Taster'
                  ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40'
                  : 'bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white text-sm">Q-Grader (Taster)</span>
                  {user?.role === 'Taster' && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Read-only sensory lab access: view recipes, sensory radar profiling, interactive brew timer.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all mt-1" />
            </button>
          </div>
        )}

        {/* Tab 2: Standard Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="barista@brewlog.local"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-zinc-300">Password</label>
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setError(null); }}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold rounded-xl text-sm transition-all"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Tab 3: Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="James Hoffmann"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Password (min 6 chars)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Account Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegisterRole('Barista')}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                    registerRole === 'Barista'
                      ? 'bg-amber-950/30 border-amber-500 text-amber-200 font-semibold'
                      : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Coffee className="w-4 h-4 mb-1" />
                  Barista (Can create recipes)
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterRole('Taster')}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                    registerRole === 'Taster'
                      ? 'bg-amber-950/30 border-amber-500 text-amber-200 font-semibold'
                      : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4 mb-1" />
                  Taster (Read-only lab access)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold rounded-xl text-sm transition-all"
            >
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Tab 4: Forgot Password */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-xs text-zinc-400">
              Enter your registered email. We will send a secure 1-hour password reset link to your Mailpit local inbox.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="barista@brewlog.local"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTab('login')}
                className="w-1/3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold rounded-xl text-sm transition-all"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
