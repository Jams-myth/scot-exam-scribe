
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const TOKEN_KEY = 'authToken';
const REDIRECT_KEY = 'redirectAfterLogin';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const isValid = !!token;
        console.log('Auth check - Token exists:', isValid);
        if (token) {
          console.log('Token format check:', token.substring(0, 15) + '...');
        }
        setIsAuthenticated(isValid);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY) {
        console.log('Auth token changed in storage');
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname]);

  const login = async (token: string) => {
    try {
      let finalToken = token;
      if (!token.startsWith('Bearer ')) {
        finalToken = `Bearer ${token}`;
      }
      
      console.log('Setting auth token:', finalToken.substring(0, 20) + '...');
      localStorage.setItem(TOKEN_KEY, finalToken);
      setIsAuthenticated(true);
      
      // Add delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const redirectTo = localStorage.getItem(REDIRECT_KEY) || '/';
      console.log('Redirecting after login to:', redirectTo);
      
      localStorage.removeItem(REDIRECT_KEY);
      toast.success('Login successful, redirecting...');
      navigate(redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    }
  };

  const logout = () => {
    console.log('Logging out, removing auth token');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REDIRECT_KEY);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const redirectToLogin = (from: string = '/') => {
    if (location.pathname !== '/login') {
      console.log('Saving redirect path:', from);
      localStorage.setItem(REDIRECT_KEY, from);
      navigate(`/login?redirect=${encodeURIComponent(from)}`);
    }
  };

  return { 
    isAuthenticated, 
    isLoading,
    login, 
    logout,
    redirectToLogin
  };
};
