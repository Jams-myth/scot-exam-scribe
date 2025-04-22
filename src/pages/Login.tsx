
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { API_URL } from '@/services/api';
import { loginUser } from '@/services/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { isAuthenticated, isLoading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = () => {
    const urlParams = new URLSearchParams(location.search);
    const redirectPath = urlParams.get('redirect') || localStorage.getItem('redirectAfterLogin') || '/questions';
    return redirectPath;
  };

  useEffect(() => {
    if (isAuthenticated && !isLoading && !loginInProgress) {
      const redirectPath = getRedirectPath();
      console.log('Already authenticated, redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, loginInProgress, location.search]);
  
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        setApiStatus('checking');
        // Use a more reliable endpoint for health checks
        const response = await fetch(`${API_URL}/health`, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          // Add timeout to avoid long waits
          signal: AbortSignal.timeout(5000)
        });
        setApiStatus(response.ok ? 'online' : 'offline');
        console.log(`API health check result: ${response.ok ? 'online' : 'offline'}`);
      } catch (error) {
        console.error('API status check failed:', error);
        setApiStatus('offline');
      }
    };
    
    checkApiStatus();
    
    // Periodically check API status
    const intervalId = setInterval(checkApiStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginInProgress) return;
    
    setLoginInProgress(true);
    setLoginError(null);
    console.log('Login attempt for user:', username);
    
    try {
      const token = await loginUser(username, password);
      
      localStorage.setItem('authToken', `Bearer ${token}`);
      
      toast.success('Login successful');
      
      const redirectPath = getRedirectPath();
      navigate(redirectPath, { replace: true });
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setLoginError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoginInProgress(false);
    }
  };

  const toggleDebug = () => setShowDebug(!showDebug);

  const clearToken = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('redirectAfterLogin');
    toast.info('Token cleared');
    setTimeout(() => window.location.reload(), 500);
  };

  if (isLoading && !loginInProgress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to Exam Vault</CardTitle>
        </CardHeader>
        <CardContent>
          {apiStatus === 'offline' && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                API server appears to be offline or unreachable. Login may not work until the server is available.
              </AlertDescription>
            </Alert>
          )}
          
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block mb-2">Username</label>
              <Input 
                type="text" 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                disabled={loginInProgress || apiStatus === 'offline'}
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-2">Password</label>
              <Input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={loginInProgress || apiStatus === 'offline'}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || loginInProgress || apiStatus === 'offline'}
            >
              {loginInProgress ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  <span>Logging in...</span>
                </div>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-500 mt-2">
            API: {apiStatus === 'checking' ? 'Checking...' : apiStatus === 'online' ? 'Online' : 'Offline'} - 
            {API_URL}
          </p>
        </CardFooter>
      </Card>

      <div className="flex gap-2 mt-4">
        <Button
          variant="ghost"
          onClick={toggleDebug}
        >
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </Button>
        
        <Button 
          variant="outline" 
          onClick={clearToken}
          className="text-red-500"
        >
          Clear Token
        </Button>
      </div>

      {showDebug && (
        <Card className="w-full max-w-md mt-4 p-4">
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify({
              isAuthenticated,
              isLoading,
              loginInProgress,
              redirectPath: getRedirectPath(),
              currentPath: location.pathname,
              apiUrl: API_URL,
              hasToken: !!localStorage.getItem('authToken'),
              tokenPreview: localStorage.getItem('authToken') 
                ? `${localStorage.getItem('authToken')?.substring(0, 20)}...` 
                : 'none',
              timestamp: new Date().toISOString(),
              apiStatus
            }, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default Login;
