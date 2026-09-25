import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden flex flex-col animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-48 bg-zinc-800/40 relative">
        <div className="absolute top-3 left-3 w-16 h-6 rounded-lg bg-zinc-700/40" />
        <div className="absolute top-3 right-3 w-10 h-6 rounded-lg bg-zinc-700/40" />
      </div>

      {/* Card Content Skeleton */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="w-24 h-3 rounded bg-zinc-800 mb-2" />
          <div className="w-3/4 h-5 rounded bg-zinc-800 mb-2" />
          <div className="w-1/2 h-3 rounded bg-zinc-800/80 mb-5" />

          {/* Specs Grid Skeleton */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/40 mb-4">
            <div className="h-7 bg-zinc-800/50 rounded" />
            <div className="h-7 bg-zinc-800/50 rounded" />
            <div className="h-7 bg-zinc-800/50 rounded" />
          </div>

          {/* Sensory bars skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-2.5 bg-zinc-800/40 rounded w-full" />
            <div className="h-2.5 bg-zinc-800/40 rounded w-full" />
            <div className="h-2.5 bg-zinc-800/40 rounded w-full" />
          </div>
        </div>

        {/* Buttons skeleton */}
        <div className="pt-3 border-t border-zinc-800/60 flex items-center gap-2">
          <div className="flex-1 h-9 rounded-xl bg-zinc-800/50" />
          <div className="w-9 h-9 rounded-xl bg-zinc-800/50" />
          <div className="w-9 h-9 rounded-xl bg-zinc-800/50" />
        </div>
      </div>
    </div>
  );
};
