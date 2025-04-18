
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

// For debugging purposes
const TOKEN_KEY = 'authToken';
const REDIRECT_KEY = 'redirectAfterLogin';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication on initial load and route changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const isValid = !!token;
      console.log('Auth check - Token exists:', isValid);
      if (token) {
        console.log('Token format check:', token.substring(0, 15) + '...');
      }
      setIsAuthenticated(isValid);
    };
    
    checkAuth();
    
    // Listen for storage events (in case token is updated in another tab)
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

  const login = (token: string) => {
    // Ensure token format is correct - should it have 'Bearer ' prefix?
    let finalToken = token;
    if (token.startsWith('Bearer ')) {
      console.log('Token already has Bearer prefix, storing without it');
      finalToken = token.substring(7); // Remove Bearer prefix for storage
    }
    
    console.log('Setting auth token:', finalToken.substring(0, 10) + '...');
    localStorage.setItem(TOKEN_KEY, finalToken);
    setIsAuthenticated(true);
    
    // Check if there's a redirect path stored
    const redirectTo = localStorage.getItem(REDIRECT_KEY) || '/';
    console.log('Redirecting after login to:', redirectTo);
    
    localStorage.removeItem(REDIRECT_KEY);
    toast.success('Login successful, redirecting...');
    navigate(redirectTo);
  };

  const logout = () => {
    console.log('Logging out, removing auth token');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REDIRECT_KEY);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
    navigate('/login');
  };

  // Save intended destination before redirecting to login
  const redirectToLogin = (from: string = '/') => {
    console.log('Saving redirect path:', from);
    localStorage.setItem(REDIRECT_KEY, from);
    navigate(`/login?redirect=${encodeURIComponent(from)}`);
  };

  return { 
    isAuthenticated, 
    login, 
    logout,
    redirectToLogin
  };
};
