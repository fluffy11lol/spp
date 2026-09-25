import React, { useState } from 'react';
import type { Recipe } from './types/recipe';
import { useRecipes } from './context/RecipeContext';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { RecipeCard } from './components/RecipeCard';
import { RecipeModal } from './components/RecipeModal';
import { BrewTimerModal } from './components/BrewTimerModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { SkeletonCard } from './components/SkeletonCard';
import { Coffee, PlusCircle } from 'lucide-react';

export const App: React.FC = () => {
  const {
    recipes,
    loading,
    search,
    selectedMethod,
    setSearch,
    setSelectedMethod,
    createRecipe,
    updateRecipe,
    deleteRecipe,
  } = useRecipes();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const [timerRecipe, setTimerRecipe] = useState<Recipe | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleCreateOrUpdate = async (formData: FormData) => {
    if (editingRecipe) {
      await updateRecipe(editingRecipe.id, formData);
    } else {
      await createRecipe(formData);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0e0e11] text-zinc-100">
      <Navbar
        onOpenCreate={() => {
          setEditingRecipe(null);
          setIsModalOpen(true);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <FilterBar />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-200 mb-1">No recipes found</h3>
            <p className="text-xs text-zinc-400 mb-5 max-w-xs">
              {search || selectedMethod !== 'All'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Your coffee lab is empty. Start by adding your first specialty coffee recipe!'}
            </p>
            <button
              onClick={() => {
                if (search || selectedMethod !== 'All') {
                  setSearch('');
                  setSelectedMethod('All');
                } else {
                  setEditingRecipe(null);
                  setIsModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>
                {search || selectedMethod !== 'All' ? 'Reset Filters' : 'Create First Recipe'}
              </span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={(r) => {
                  setEditingRecipe(r);
                  setIsModalOpen(true);
                }}
                onDelete={(r) => {
                  setDeletingRecipe(r);
                  setIsDeleteOpen(true);
                }}
                onStartBrew={(r) => {
                  setTimerRecipe(r);
                  setIsTimerOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <RecipeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecipe(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingRecipe}
      />

      <BrewTimerModal
        isOpen={isTimerOpen}
        onClose={() => {
          setIsTimerOpen(false);
          setTimerRecipe(null);
        }}
        recipe={timerRecipe}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        recipe={deletingRecipe}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingRecipe(null);
        }}
        onConfirm={deleteRecipe}
      />
    </div>
  );
};
