import React from 'react';
import { Coffee, Plus, FileCode2, Shield, Laptop, Activity, Mail } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenCreate: () => void;
  onOpenAuth: () => void;
  onOpenSessions: () => void;
  onOpenAudit: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreate,
  onOpenAuth,
  onOpenSessions,
  onOpenAudit,
}) => {
  const { recipes } = useRecipes();
  const { user, role, canCreate } = useAuth();

  const roleColor =
    role === 'Admin'
      ? 'border-purple-500/40 text-purple-300 bg-purple-500/10'
      : role === 'Barista'
      ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
      : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10';

  return (
    <header className="border-b border-zinc-800/60 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 py-3 flex items-center justify-between">
        {/* Minimalist Brand Logo & Title */}
        <div className="flex items-center gap-2.5 cursor-default">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-base text-zinc-100 tracking-tight">BrewLog</span>
            <span className="text-xs text-zinc-500 font-normal hidden sm:inline">
              / Specialty Extraction Lab
            </span>
          </div>
        </div>

        {/* Minimalist Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs text-zinc-500 font-mono hidden xl:inline cursor-default">
            <span className="text-zinc-300 font-semibold">{recipes.length}</span> recipes
          </span>

          {/* Active Persona Pill / Auth Trigger */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${roleColor}`}
            title="Click to switch role or account"
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold">{role || 'Guest'}</span>
            {user && (
              <span className="text-zinc-400 hidden md:inline">• {user.name}</span>
            )}
          </button>

          {/* Active Sessions Dashboard Trigger */}
          <button
            onClick={onOpenSessions}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-zinc-800/80 transition-colors"
            title="Active sessions & devices"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sessions</span>
          </button>

          {/* Admin Audit Logs Trigger */}
          {role === 'Admin' && (
            <button
              onClick={onOpenAudit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 border border-purple-900/50 transition-colors"
              title="Security audit logs"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Audit</span>
            </button>
          )}

          {/* Mailpit Link */}
          <a
            href="http://localhost:8025"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-zinc-800/80 transition-colors"
            title="Open Mailpit inbox to see password reset emails"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Mailpit</span>
          </a>

          {/* Swagger API docs */}
          <a
            href="/documentation"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-zinc-800/80 transition-colors"
            title="Open Swagger API documentation"
          >
            <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Docs</span>
          </a>

          {/* New Recipe button (Role-Aware) */}
          {canCreate ? (
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm shadow-amber-500/20 transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">New Recipe</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/40 text-zinc-500 border border-zinc-800/60 cursor-not-allowed select-none"
              title="Tasters have read-only access. Switch to Barista or Admin to create recipes."
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Read Only</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
