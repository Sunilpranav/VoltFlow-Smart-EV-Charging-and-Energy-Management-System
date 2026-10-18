import React, { useState, useEffect, useCallback } from 'react';
import type { User, AuthResponse } from '../types';
import { authApi } from '../api/client';
import { AuthContext, type AuthContextType } from './AuthContextDefinition';

export type { AuthContextType };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('voltflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('voltflow_token'));
  const [loading, setLoading] = useState<boolean>(!token ? false : true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('voltflow_token');
    localStorage.removeItem('voltflow_user');
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    };
    window.addEventListener('voltflow:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('voltflow:unauthorized', handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    let isMounted = true;
    if (token) {
      authApi.getMe()
        .then((fetchedUser) => {
          if (isMounted) {
            setUser(fetchedUser);
            localStorage.setItem('voltflow_user', JSON.stringify(fetchedUser));
          }
        })
        .catch(() => {
          if (isMounted) {
            logout();
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  const handleAuthSuccess = (res: AuthResponse) => {
    setToken(res.token);
    localStorage.setItem('voltflow_token', res.token);
    const minimalUser: User = {
      id: 0,
      fullName: res.fullName,
      email: res.email,
      role: res.role,
    };
    setUser(minimalUser);
    localStorage.setItem('voltflow_user', JSON.stringify(minimalUser));
  };

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    handleAuthSuccess(res);
  };

  const register = async (payload: { fullName: string; email: string; password: string; phone?: string }) => {
    const res = await authApi.register(payload);
    handleAuthSuccess(res);
  };

  const refreshUser = async () => {
    if (token) {
      const fetchedUser = await authApi.getMe();
      setUser(fetchedUser);
      localStorage.setItem('voltflow_user', JSON.stringify(fetchedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
