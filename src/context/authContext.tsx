// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Role, AuthState } from '../types/auth';
import { decodeJWT, getValidToken, getRolesFromToken } from '../utils/jwt';

interface AuthContextType extends AuthState {
  login: (token: string) => void;
  logout: () => void;
  hasRole: (role: Role | Role[]) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  getToken: () => string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    roles: [],
    isAuthenticated: false,
    isLoading: true,
  });

  // Inicializar estado desde localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const token = getValidToken();
      
      if (token) {
        const decoded = decodeJWT(token);
        
        if (decoded) {
          const user: User = {
            id: decoded.userid,
            username: decoded.sub,
            roles: decoded.roles,
          };
          
          setState({
            user,
            roles: decoded.roles as Role[],
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
    };

    initializeAuth();
  }, []);

  const login = (token: string) => {
    localStorage.setItem('rdp_token', token);
    const decoded = decodeJWT(token);
    
    if (decoded) {
      const user: User = {
        id: decoded.userid,
        username: decoded.sub,
        roles: decoded.roles,
      };
      
      setState({
        user,
        roles: decoded.roles as Role[],
        isAuthenticated: true,
        isLoading: false,
      });
    }
  };

const logout = async () => {
  const accessToken = getValidToken();
  const refreshToken = localStorage.getItem('rdp_refresh_token');

  if (accessToken && refreshToken) {
    try {
      await fetch(`${import.meta.env.VITE_AUTH_API_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ refreshToken })
      });
    } catch (err) {
      console.warn('Error en logout backend:', err);
    }
  }

  // Limpiar almacenamiento local
  localStorage.removeItem('rdp_token');
  localStorage.removeItem('rdp_refresh_token');

  // Resetear estado
  setState({
    user: null,
    roles: [],
    isAuthenticated: false,
    isLoading: false,
  });
};

  const hasRole = (roleOrRoles: Role | Role[]): boolean => {
    const rolesToCheck = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    return rolesToCheck.some(role => state.roles.includes(role));
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    return roles.some(role => state.roles.includes(role));
  };

  const getToken = (): string | null => {
    return getValidToken();
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        hasRole,
        hasAnyRole,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};