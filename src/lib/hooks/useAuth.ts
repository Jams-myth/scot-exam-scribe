
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication on initial load and route changes
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, [location.pathname]);

  const login = (token: string) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
    
    // Check if there's a redirect path stored
    const redirectTo = localStorage.getItem('redirectAfterLogin');
    if (redirectTo) {
      localStorage.removeItem('redirectAfterLogin');
      toast.success('Login successful, redirecting...');
      navigate(redirectTo);
    } else {
      toast.success('Login successful');
      navigate('/');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('redirectAfterLogin');
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
    navigate('/login');
  };

  // Save intended destination before redirecting to login
  const redirectToLogin = (from: string = '/') => {
    localStorage.setItem('redirectAfterLogin', from);
    navigate(`/login?redirect=${encodeURIComponent(from)}`);
  };

  return { 
    isAuthenticated, 
    login, 
    logout,
    redirectToLogin
  };
};
