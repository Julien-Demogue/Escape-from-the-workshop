import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    // Rediriger vers la page de connexion en conservant l'URL de destination
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Vérifier si le token n'est pas expiré
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return <Navigate to="/" state={{ from: location }} replace />;
    }
  } catch {
    localStorage.removeItem('token');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;