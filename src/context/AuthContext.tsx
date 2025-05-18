'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IUser } from '@/types';

interface AuthContextType {
  user: IUser | null;
  isAdmin: boolean;
  isAuthLoaded: boolean;
  login: (userData: IUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isAuthLoaded: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const isAdmin = !!user?.is_admin;

  useEffect(() => {
    // Intenta cargar el usuario desde localStorage al iniciar
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Verificar que el usuario tenga un ID válido
        if (parsedUser && parsedUser._id) {
          setUser(parsedUser);
        } else {
          console.warn('Datos de usuario incompletos en localStorage, eliminando sesión');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Error al cargar usuario desde localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setIsAuthLoaded(true);
    }
  }, []);

  const login = (userData: IUser, token: string) => {
    // Verificar que el usuario tenga un ID antes de guardarlo
    if (!userData._id) {
      console.error('Intento de login con datos de usuario incompletos');
      return;
    }
    
    // Guardar en estado y localStorage
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isAuthLoaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);