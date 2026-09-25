import React from 'react';
import { Coffee, Plus, FileCode2 } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';

interface NavbarProps {
  onOpenCreate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreate }) => {
  const { recipes } = useRecipes();

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
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-mono hidden md:inline cursor-default">
            <span className="text-zinc-300 font-semibold">{recipes.length}</span> recipes
          </span>

          <a
            href="/documentation"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-zinc-800/80 transition-colors"
            title="Open Swagger API documentation"
          >
            <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Swagger API</span>
          </a>

          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm shadow-amber-500/20 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Recipe</span>
          </button>
        </div>
      </div>
    </header>
  );
};
