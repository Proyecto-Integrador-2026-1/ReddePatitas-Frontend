import { Navigate } from 'react-router-dom';
import { Role } from '../types/auth';
import { useAuth } from '../hooks/useAuth';

interface RoleGuardProps {
  roles: Role | Role[];
  children: React.ReactNode;
  fallbackPath?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  roles, 
  children, 
  fallbackPath = '/no-autorizado' 
}) => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return <div>Verificando permisos...</div>;
  }

  return hasRole(roles) ? <>{children}</> : <Navigate to={fallbackPath} replace />;
};