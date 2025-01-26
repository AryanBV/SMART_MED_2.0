import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '@/services/auth';
import { AuthContextType, AuthResponse, LoginCredentials, RegisterCredentials } from '@/interfaces/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await AuthService.validateToken();
          setUser(response.user);
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await AuthService.login(credentials);
    localStorage.setItem('token', response.token);
    setUser(response.user);
    setIsAuthenticated(true);
  };

  const register = async (credentials: RegisterCredentials) => {
    const response = await AuthService.register(credentials);
    localStorage.setItem('token', response.token);
    setUser(response.user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};