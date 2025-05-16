'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IUser } from '@/models/interfaces';

interface LoginResponse {
  token: string;
  user: Omit<IUser, 'password'>;
}

interface AuthContextType {
  user: IUser | null;
  isAdmin: boolean;
  login: (token: string, userData: Omit<IUser, 'password'>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (token: string, userData: Omit<IUser, 'password'>) => {
    try {
      // Asegurarnos de que el usuario tenga todos los campos necesarios
      const user: IUser = {
        _id: userData._id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        password: '', // No guardamos la contraseña en el frontend
        is_admin: userData.is_admin,
        role: userData.role || 'cliente',
      };

      console.log('Usuario procesado:', user);
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } catch (error: any) {
      console.error('Error detallado al iniciar sesión:', error);
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const isAdmin = user?.is_admin || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}