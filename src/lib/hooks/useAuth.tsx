
import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { loginUser } from '@/services/auth';

const TOKEN_KEY = 'authToken';
const REDIRECT_KEY = 'redirectAfterLogin';
const AUTH_CHECK_INTERVAL = 30000; // Check every 30 seconds

// Create a context to share auth state
const AuthContext = createContext<ReturnType<typeof useAuthProvider> | null>(null);

// Main provider hook that manages authentication state
const useAuthProvider = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const checkTimeoutRef = useRef<number | null>(null);
  const lastCheckRef = useRef<number>(0);
  const redirectInProgressRef = useRef(false);

  // Validate JWT token structure and expiration
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

  // Main function to check authentication status
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
    
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      
      if (!token) {
        setIsAuthenticated(false);
        setAuthToken(null);
        setIsLoading(false);
        return;
      }
      
      if (validateToken(token)) {
        // Only update if there's a change to prevent unnecessary renders
        if (!isAuthenticated || authToken !== token) {
          setIsAuthenticated(true);
          setAuthToken(token);
        }
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
      
      // Schedule next check with a longer interval
      checkTimeoutRef.current = window.setTimeout(checkAuth, AUTH_CHECK_INTERVAL);
    }
  }, [validateToken, isAuthenticated, authToken]);

  // Initial auth check on mount
  useEffect(() => {
    checkAuth();
    
    return () => {
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [checkAuth]);

  // Listen for storage events (when token changes in another tab)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY) {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const token = await loginUser(username, password);
      
      let finalToken = token;
      if (!token.startsWith('Bearer ')) {
        finalToken = `Bearer ${token}`;
      }
      
      console.log('Setting auth token:', finalToken.substring(0, 20) + '...');
      
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(TOKEN_KEY, finalToken);
      
      setAuthToken(finalToken);
      setIsAuthenticated(true);
      
      const redirectTo = localStorage.getItem(REDIRECT_KEY) || '/questions';
      localStorage.removeItem(REDIRECT_KEY);
      
      // Show success message and set redirect flag
      toast.success('Login successful');
      
      // Small delay before redirect to ensure toast is seen
      setTimeout(() => {
        redirectInProgressRef.current = true;
        navigate(redirectTo, { replace: true });
      }, 300);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    console.log('Logging out, removing auth token');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REDIRECT_KEY);
    setAuthToken(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
    navigate('/login', { replace: true });
  };

  // Redirect to login with saved destination
  const redirectToLogin = (from: string = location.pathname) => {
    // Prevent redirect loops
    if (redirectInProgressRef.current || location.pathname === '/login') {
      return;
    }
    
    console.log('Saving redirect path:', from);
    localStorage.setItem(REDIRECT_KEY, from);
    navigate('/login', { replace: true });
  };

  return { 
    isAuthenticated, 
    isLoading,
    authToken,
    login, 
    logout,
    redirectToLogin,
    checkAuth
  };
};

// Export the provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuthProvider();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
