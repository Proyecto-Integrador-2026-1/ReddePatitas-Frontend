// src/utils/jwt.utils.ts
import { JWTPayload, Role } from '../types/auth';

/**
 * Decodifica un token JWT sin validar la firma (solo para UI)
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    // Usando atob que es seguro en Vite/React
    const decodedPayload = JSON.parse(atob(payload));
    
    return decodedPayload as JWTPayload;
  } catch (error) {
    console.error('Error decodificando JWT:', error);
    return null;
  }
};

/**
 * Extrae `userId` del token JWT si está presente.
 */
export const getUserIdFromToken = (token: string): string | null => {
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  // El UUID está en el campo 'userid'
  return decoded.userid ?? null;
};

/**
 * Verifica si el token ha expirado
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded) return true;
  
  // exp viene en segundos, Date.now() en milisegundos
  const expirationTime = decoded.exp * 1000;
  return Date.now() >= expirationTime;
};

/**
 * Extrae los roles del token
 */
export const getRolesFromToken = (token: string): Role[] => {
  const decoded = decodeJWT(token);
  return (decoded?.roles as Role[]) || [];
};

/**
 * Verifica si el token contiene un rol específico
 */
export const tokenHasRole = (token: string, role: Role): boolean => {
  const roles = getRolesFromToken(token);
  return roles.includes(role);
};

/**
 * Obtiene el token almacenado y válido
 */
export const getValidToken = (): string | null => {
  const token = localStorage.getItem('rdp_token');
  
  if (!token) return null;
  if (isTokenExpired(token)) {
    localStorage.removeItem('rdp_token');
    return null;
  }
  
  return token;
};