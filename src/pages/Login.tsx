import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { API_URL, loginUser } from '@/services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = () => {
    const urlParams = new URLSearchParams(location.search);
    const redirectPath = urlParams.get('redirect') || localStorage.getItem('redirectAfterLogin') || '/';
    console.log('Login - Redirect path:', redirectPath);
    return redirectPath;
  };

  useEffect(() => {
    localStorage.removeItem('lastAuthCheck');
    
    if (!isLoading && isAuthenticated) {
      const redirectPath = getRedirectPath();
      console.log('Already authenticated, redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt for user:', username);
    setLoginInProgress(true);
    
    try {
      const token = await loginUser(username, password);
      console.log('Login successful, token received');
      
      // Clear localStorage first to prevent any caching issues
      localStorage.removeItem('authToken');
      
      // Wait a tiny bit to ensure localStorage is cleared
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Now login with the token
      await login(token);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
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

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to Exam Vault</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block mb-2">Username</label>
              <Input 
                type="text" 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
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
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || loginInProgress}>
              {loginInProgress ? 'Logging in...' : isLoading ? 'Loading...' : 'Login'}
            </Button>
          </form>
        </CardContent>
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
              redirectPath: getRedirectPath(),
              currentPath: location.pathname,
              apiUrl: API_URL,
              hasToken: !!localStorage.getItem('authToken'),
              tokenPreview: localStorage.getItem('authToken') 
                ? `${localStorage.getItem('authToken')?.substring(0, 20)}...` 
                : 'none',
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default Login;
