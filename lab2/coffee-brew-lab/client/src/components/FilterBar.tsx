import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { BrewMethod } from '../types/recipe';
import { useRecipes } from '../context/RecipeContext';

const METHODS: (BrewMethod | 'All')[] = [
  'All',
  'V60',
  'Aeropress',
  'Chemex',
  'Origami',
  'Espresso',
  'French Press',
];

export const FilterBar: React.FC = () => {
  const { search, setSearch, selectedMethod, setSelectedMethod } = useRecipes();

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-6">
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by lot, roaster, or origin..."
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/70 transition-all"
        />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
        <div className="flex items-center gap-1 text-zinc-500 text-xs mr-1 pl-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Method:</span>
        </div>
        {METHODS.map((method) => {
          const isActive = selectedMethod === method;
          return (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {method === 'All' ? 'All Methods' : method}
            </button>
          );
        })}
      </div>
    </div>
  );
};
