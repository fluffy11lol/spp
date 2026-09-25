import React, { useState, useEffect } from 'react';
import { X, Smartphone, Globe, Shield, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import type { UserSession } from '../types/recipe';
import { fetchActiveSessions, revokeActiveSession } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveSessions();
      setSessions(data.sessions);
      setCurrentSessionId(data.currentSessionId);
    } catch (err: any) {
      setError(err.message || 'Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

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

  const handleRevoke = async (id: string) => {
    try {
      await revokeActiveSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to revoke session');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-white">Active Sessions & Devices</h2>
          </div>
          <button
            onClick={loadSessions}
            disabled={loading}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Refresh sessions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <p className="text-xs text-zinc-400 mb-6">
          {user?.role === 'Admin'
            ? 'Administrator view: Monitoring all active connections across users.'
            : 'Devices currently authenticated to your BrewLab account. You can revoke any unfamiliar session.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {sessions.length === 0 && !loading && (
            <p className="text-sm text-zinc-500 text-center py-8">No active sessions found.</p>
          )}

          {sessions.map((sess) => {
            const isCurrent = sess.id === currentSessionId;
            const parsedAgent = sess.user_agent || 'Unknown Browser';

            return (
              <div
                key={sess.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isCurrent
                    ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/30'
                    : 'bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400 mt-0.5">
                    {parsedAgent.toLowerCase().includes('mobile') ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate max-w-[200px] md:max-w-xs">
                        {sess.user_email ? `${sess.user_email} • ` : ''}
                        {sess.ip_address || '127.0.0.1'}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-medium">
                          Current Device
                        </span>
                      )}
                      {sess.user_role && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                          {sess.user_role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate max-w-[240px] md:max-w-sm mt-0.5">
                      {parsedAgent}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Logged in: {new Date(sess.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => handleRevoke(sess.id)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-2 shrink-0"
                    title="Revoke session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
