
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const TOKEN_KEY = 'authToken';
const REDIRECT_KEY = 'redirectAfterLogin';
const AUTH_CHECK_INTERVAL = 10000; // Check auth every 10 seconds

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const checkTimeoutRef = useRef<number | null>(null);
  const lastCheckRef = useRef<number>(0);

  // Check if token is valid and not expired
  const validateToken = useCallback((token: string): boolean => {
    if (!token) return false;
    
    try {
      // For a JWT token, we extract the payload and check expiration
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format (not three parts):', token.substring(0, 15) + '...');
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < now) {
        console.warn('Token expired at:', new Date(payload.exp * 1000).toISOString());
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }, []);

  const checkAuth = useCallback(() => {
    // Prevent too frequent checks (at least 1 second between checks)
    const now = Date.now();
    if (now - lastCheckRef.current < 1000) {
      return;
    }
    lastCheckRef.current = now;
    
    // Clear any pending timeout to avoid multiple checks
    if (checkTimeoutRef.current) {
      window.clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      
      if (!token) {
        console.log('Auth check: No token found');
        setIsAuthenticated(false);
        setAuthToken(null);
        return;
      }
      
      const isValid = validateToken(token);
      console.log('Auth check: Token valid =', isValid);
      
      if (isValid) {
        console.log('Token format check:', token.substring(0, 20) + '...');
        setIsAuthenticated(true);
        setAuthToken(token);
      } else {
        console.log('Token invalid, removing...');
        localStorage.removeItem(TOKEN_KEY);
        setIsAuthenticated(false);
        setAuthToken(null);
        toast.error('Session expired, please login again');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
      
      // Schedule next check
      checkTimeoutRef.current = window.setTimeout(() => {
        checkAuth();
      }, AUTH_CHECK_INTERVAL);
    }
  }, [validateToken]);
  
  useEffect(() => {
    // Initial auth check
    checkAuth();
    
    // Cleanup on unmount
    return () => {
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [checkAuth]);

  useEffect(() => {
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
  }, [checkAuth]);

  const login = async (token: string) => {
    try {
      let finalToken = token;
      if (!token.startsWith('Bearer ')) {
        finalToken = `Bearer ${token}`;
      }
      
      console.log('Setting auth token:', finalToken.substring(0, 20) + '...');
      
      // Clear existing token first
      localStorage.removeItem(TOKEN_KEY);
      
      // Set the new token
      localStorage.setItem(TOKEN_KEY, finalToken);
      
      // Update state
      setAuthToken(finalToken);
      setIsAuthenticated(true);
      
      // Add delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const redirectTo = localStorage.getItem(REDIRECT_KEY) || '/';
      console.log('Redirecting after login to:', redirectTo);
      
      localStorage.removeItem(REDIRECT_KEY);
      toast.success('Login successful, redirecting...');
      
      // Use history replace to avoid back button issues
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    }
  };

  const logout = () => {
    console.log('Logging out, removing auth token');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REDIRECT_KEY);
    setAuthToken(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
    navigate('/login', { replace: true });
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
    authToken,
    login, 
    logout,
    redirectToLogin
  };
};
