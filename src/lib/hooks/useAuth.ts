
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { isAuthenticated as checkAuth } from '@/services/auth';

const TOKEN_KEY = 'authToken';
const REDIRECT_KEY = 'redirectAfterLogin';
const AUTH_CHECK_INTERVAL = 10000;

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const checkTimeoutRef = useRef<number | null>(null);
  const lastCheckRef = useRef<number>(0);

  const validateToken = useCallback((token: string): boolean => {
    if (!token) return false;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format:', token.substring(0, 20) + '...');
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
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
    const now = Date.now();
    if (now - lastCheckRef.current < 1000) {
      return;
    }
    lastCheckRef.current = now;
    
    if (checkTimeoutRef.current) {
      window.clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      console.log('Checking auth token:', token ? `${token.substring(0, 20)}...` : 'none');
      
      if (!token) {
        setIsAuthenticated(false);
        setAuthToken(null);
        return;
      }
      
      if (validateToken(token)) {
        setIsAuthenticated(true);
        setAuthToken(token);
      } else {
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
      
      checkTimeoutRef.current = window.setTimeout(checkAuth, AUTH_CHECK_INTERVAL);
    }
  }, [validateToken]);

  useEffect(() => {
    checkAuth();
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
      
      localStorage.removeItem(TOKEN_KEY);
      
      localStorage.setItem(TOKEN_KEY, finalToken);
      
      setAuthToken(finalToken);
      setIsAuthenticated(true);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const redirectTo = localStorage.getItem(REDIRECT_KEY) || '/';
      console.log('Redirecting after login to:', redirectTo);
      
      localStorage.removeItem(REDIRECT_KEY);
      toast.success('Login successful, redirecting...');
      
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
