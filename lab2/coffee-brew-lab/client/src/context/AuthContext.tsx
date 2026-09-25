import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole, Recipe } from '../types/recipe';
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  getStoredAccessToken,
} from '../api/client';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'Taster' | 'Barista') => Promise<void>;
  logout: () => Promise<void>;
  switchPersona: (persona: 'Admin' | 'Barista' | 'Taster') => Promise<void>;
  canCreate: boolean;
  canEdit: (recipe: Recipe) => boolean;
  canDelete: (recipe: Recipe) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      // Auto-login with default Barista persona if first time visitor to make the app immediately interactive
      try {
        const result = await loginUser('barista@brewlog.local', 'Password123!');
        setUser(result.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const me = await fetchCurrentUser();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email: string, pass: string) => {
    const result = await loginUser(email, pass);
    setUser(result.user);
  };

  const register = async (email: string, pass: string, name: string, role: 'Taster' | 'Barista') => {
    const result = await registerUser(email, pass, name, role);
    setUser(result.user);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const switchPersona = async (persona: 'Admin' | 'Barista' | 'Taster') => {
    setIsLoading(true);
    try {
      const email =
        persona === 'Admin'
          ? 'admin@brewlog.local'
          : persona === 'Barista'
          ? 'barista@brewlog.local'
          : 'taster@brewlog.local';

      const result = await loginUser(email, 'Password123!');
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const role = user?.role || null;
  const isAuthenticated = !!user;

  // RBAC permissions helpers
  const canCreate = role === 'Barista' || role === 'Admin';

  const canEdit = (recipe: Recipe): boolean => {
    if (!user) return false;
    if (role === 'Admin') return true;
    if (role === 'Barista') {
      // Barista can edit their own recipes or recipes created before user ownership was assigned
      return !recipe.authorId || recipe.authorId === user.id;
    }
    return false;
  };

  const canDelete = (recipe: Recipe): boolean => {
    if (!user) return false;
    if (role === 'Admin') return true;
    if (role === 'Barista') {
      return !recipe.authorId || recipe.authorId === user.id;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        switchPersona,
        canCreate,
        canEdit,
        canDelete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
