import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Recipe } from '../types/recipe';
import {
  fetchRecipes,
  createRecipe as apiCreateRecipe,
  updateRecipe as apiUpdateRecipe,
  deleteRecipe as apiDeleteRecipe,
} from '../api/client';
import { useToast } from '../components/Toast';

interface RecipeContextValue {
  recipes: Recipe[];
  loading: boolean;
  search: string;
  selectedMethod: string;
  setSearch: (query: string) => void;
  setSelectedMethod: (method: string) => void;
  refreshRecipes: () => Promise<void>;
  createRecipe: (formData: FormData) => Promise<Recipe>;
  updateRecipe: (id: number, formData: FormData) => Promise<Recipe>;
  deleteRecipe: (id: number) => Promise<void>;
}

const RecipeContext = createContext<RecipeContextValue | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const { showToast } = useToast();

  const refreshRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchRecipes(search, selectedMethod);
      setRecipes(data);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to load recipes',
        description: err.message,
        statusCode: err.status || 500,
      });
    } finally {
      setLoading(false);
    }
  }, [search, selectedMethod, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshRecipes();
    }, 200);
    return () => clearTimeout(timer);
  }, [refreshRecipes]);

  const createRecipe = async (formData: FormData): Promise<Recipe> => {
    try {
      const created = await apiCreateRecipe(formData);
      setRecipes((prev) => [created, ...prev]);
      showToast({
        type: 'success',
        title: 'Recipe created',
        description: `"${created.title}" successfully added`,
        statusCode: 201,
      });
      return created;
    } catch (err: any) {
      showToast({
        type: 'error',
        title: err.status === 400 ? 'Validation Error' : 'Save Error',
        description: err.message || 'Please review highlighted form fields',
        statusCode: err.status || 500,
      });
      throw err;
    }
  };

  const updateRecipe = async (id: number, formData: FormData): Promise<Recipe> => {
    try {
      const updated = await apiUpdateRecipe(id, formData);
      setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast({
        type: 'success',
        title: 'Recipe updated',
        description: `Changes for "${updated.title}" were saved`,
        statusCode: 200,
      });
      return updated;
    } catch (err: any) {
      showToast({
        type: 'error',
        title: err.status === 400 ? 'Validation Error' : 'Save Error',
        description: err.message || 'Please review highlighted form fields',
        statusCode: err.status || 500,
      });
      throw err;
    }
  };

  const deleteRecipe = async (id: number): Promise<void> => {
    try {
      const result = await apiDeleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      showToast({
        type: 'success',
        title: 'Recipe deleted',
        description: result.message,
        statusCode: 200,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: err.message,
        statusCode: err.status || 500,
      });
      throw err;
    }
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        loading,
        search,
        selectedMethod,
        setSearch,
        setSelectedMethod,
        refreshRecipes,
        createRecipe,
        updateRecipe,
        deleteRecipe,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = (): RecipeContextValue => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};
