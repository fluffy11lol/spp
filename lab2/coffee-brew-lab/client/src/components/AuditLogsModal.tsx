import React, { useState, useEffect } from 'react';
import { X, Activity, RefreshCw, AlertCircle, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import type { AuditLog } from '../types/recipe';
import { fetchAuditLogs } from '../api/client';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load security audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
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

  const filteredLogs = logs.filter(
    (l) =>
      l.event_type.toLowerCase().includes(filter.toLowerCase()) ||
      (l.user_email && l.user_email.toLowerCase().includes(filter.toLowerCase())) ||
      (l.ip_address && l.ip_address.includes(filter))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden text-zinc-100 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Security & Business Audit Logs</h2>
          </div>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <p className="text-xs text-zinc-400 mb-4">
          Structured security event stream tracking logins, token cycles, permission validations, and recipe changes.
        </p>

        {/* Filter input */}
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by event (e.g. AUTH, RECIPE, ACCESS_DENIED) or email..."
          className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 mb-4 focus:outline-none focus:border-amber-500"
        />

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs">
          {filteredLogs.length === 0 && !loading && (
            <p className="text-sm font-sans text-zinc-500 text-center py-10">No audit events found.</p>
          )}

          {filteredLogs.map((log) => {
            const isDenial = log.event_type.includes('DENIED') || log.event_type.includes('FAILED') || log.event_type.includes('TAMPERING');
            const isRecipe = log.event_type.startsWith('RECIPE_');
            const isAuth = log.event_type.startsWith('AUTH_');

            return (
              <div
                key={log.id}
                className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 font-sans">
                  <div className="flex items-center gap-2">
                    {isDenial ? (
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    ) : isAuth ? (
                      <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        isDenial
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isRecipe
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {log.event_type}
                    </span>
                    {log.user_role && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {log.user_role}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-400 text-[11px] mb-1">
                  <span>User: <strong className="text-zinc-300">{log.user_email || 'anonymous'}</strong></span>
                  <span>IP: <span className="text-zinc-300">{log.ip_address || '127.0.0.1'}</span></span>
                </div>

                {log.details && Object.keys(log.details).length > 0 && (
                  <pre className="mt-1 p-2 bg-zinc-900 rounded border border-zinc-800/80 text-zinc-400 text-[10px] overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
