import React from 'react';
import {
  Play,
  Edit2,
  Trash2,
  Star,
  Thermometer,
  Clock,
  Scale,
  User as UserIcon,
} from 'lucide-react';
import type { Recipe } from '../types/recipe';
import { useAuth } from '../context/AuthContext';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onStartBrew: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onEdit,
  onDelete,
  onStartBrew,
}) => {
  const { canEdit, canDelete } = useAuth();
  const ratio = (recipe.waterAmount / recipe.coffeeWeight).toFixed(1);

  const isEditable = canEdit(recipe);
  const isDeletable = canDelete(recipe);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-amber-950/10 flex flex-col group">
      {/* Top Banner / Image Area */}
      <div className="relative h-48 bg-zinc-950 overflow-hidden">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-600">
            <span className="text-4xl mb-2">☕</span>
            <span className="text-xs uppercase tracking-widest font-semibold text-zinc-500">
              {recipe.method}
            </span>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-950/80 backdrop-blur-md text-amber-400 border border-amber-500/30">
            {recipe.method}
          </span>
          {recipe.processingMethod && (
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-900/80 backdrop-blur-md text-zinc-300 border border-zinc-700/50">
              {recipe.processingMethod}
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-amber-400 text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{recipe.rating}</span>
        </div>

        {/* Ratio pill */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-zinc-950/90 backdrop-blur-md border border-zinc-800 text-xs font-mono font-semibold text-zinc-200">
          Ratio 1:{ratio}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500/90">
              {recipe.roaster}
            </span>
            {recipe.authorName && (
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <UserIcon className="w-2.5 h-2.5" />
                <span>{recipe.authorName}</span>
              </span>
            )}
          </div>
          <h3 className="font-bold text-base text-zinc-100 leading-snug mb-1 line-clamp-1">
            {recipe.title}
          </h3>
          <p className="text-xs text-zinc-400 mb-4 line-clamp-1">{recipe.origin}</p>

          {/* Extraction Specs Grid */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 mb-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-500 mb-0.5">
                <Scale className="w-3 h-3" />
                <span>Coffee/Water</span>
              </div>
              <span className="text-xs font-semibold text-zinc-200">
                {recipe.coffeeWeight}g / {recipe.waterAmount}ml
              </span>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-500 mb-0.5">
                <Thermometer className="w-3 h-3" />
                <span>Temp</span>
              </div>
              <span className="text-xs font-semibold text-zinc-200">
                {recipe.waterTemperature}°C
              </span>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-500 mb-0.5">
                <Clock className="w-3 h-3" />
                <span>Time</span>
              </div>
              <span className="text-xs font-semibold text-zinc-200">
                {formatTime(recipe.brewTimeSeconds)}
              </span>
            </div>
          </div>

          {/* Grind size */}
          <div className="text-xs text-zinc-400 mb-3 flex items-center justify-between">
            <span className="text-zinc-500">Grind:</span>
            <span className="font-medium text-zinc-300 truncate max-w-[180px]">
              {recipe.grindSize}
            </span>
          </div>

          {/* Sensory bars */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Acidity</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`w-3.5 h-1.5 rounded-full ${
                      i <= recipe.acidity ? 'bg-amber-400' : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Sweetness</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`w-3.5 h-1.5 rounded-full ${
                      i <= recipe.sweetness ? 'bg-amber-400' : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Body</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`w-3.5 h-1.5 rounded-full ${
                      i <= recipe.body ? 'bg-amber-400' : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tasting notes tags */}
          {recipe.tastingNotes && recipe.tastingNotes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {recipe.tastingNotes.map((note) => (
                <span
                  key={note}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300"
                >
                  {note}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          {/* Brew Timer is accessible to all roles including Taster */}
          <button
            onClick={() => onStartBrew(recipe)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-zinc-950 font-semibold text-xs border border-amber-500/30 hover:border-transparent transition-all duration-200 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Brew</span>
          </button>

          {/* Edit Button with RBAC Protection */}
          {isEditable ? (
            <button
              onClick={() => onEdit(recipe)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors"
              title="Edit recipe"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed"
              title="Only author or Admin can edit this recipe"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Delete Button with RBAC Protection */}
          {isDeletable ? (
            <button
              onClick={() => onDelete(recipe)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-400 transition-colors"
              title="Delete recipe"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed"
              title="Only author or Admin can delete this recipe"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
