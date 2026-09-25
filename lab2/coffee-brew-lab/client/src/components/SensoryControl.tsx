import React from 'react';

interface SensoryControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  levels?: string[];
}

const DEFAULT_LEVELS = ['Delicate', 'Low', 'Medium', 'High', 'Intense'];

export const SensoryControl: React.FC<SensoryControlProps> = ({
  label,
  value,
  onChange,
  levels = DEFAULT_LEVELS,
}) => {
  const currentDescriptor = levels[Math.max(0, Math.min(levels.length - 1, value - 1))] || '';

  return (
    <div className="bg-zinc-950/60 border border-zinc-800/70 p-3 rounded-xl space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-zinc-300">{label}</span>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-zinc-400">{currentDescriptor}</span>
          <span className="text-amber-400 font-bold">({value}/5)</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((lvl) => {
          const isActive = lvl <= value;
          const isCurrent = lvl === value;

          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange(lvl)}
              className={`py-1.5 rounded-lg text-xs font-mono font-medium transition-all focus:outline-none flex flex-col items-center justify-center ${
                isCurrent
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/30 ring-1 ring-amber-400'
                  : isActive
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-800/80'
              }`}
              title={`Set ${label} to ${lvl} (${levels[lvl - 1]})`}
            >
              <span>{lvl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
