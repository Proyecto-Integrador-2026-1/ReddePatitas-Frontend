export interface JWTPayload {
  sub: string;        // username
  userid: string;     // ID del usuario
  roles: string[];    // Lista de roles
  iat: number;        // Issued at (timestamp)
  exp: number;        // Expiration (timestamp)
}

export interface User {
  id: string;
  username: string;
  roles: string[];
}

export type Role = 'ROLE_ADMIN' | 'ROLE_USER' ;

export interface AuthState {
  user: User | null;
  roles: Role[];
  isAuthenticated: boolean;
  isLoading: boolean;
}