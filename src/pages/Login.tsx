
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { API_URL } from '@/services/api';

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
    const redirectPath = urlParams.get('redirect') || localStorage.getItem('redirectAfterLogin') || '/questions';
    return redirectPath;
  };

  useEffect(() => {
    // If already authenticated, redirect to destination path
    // This includes a check to prevent unnecessary effect runs
    if (isAuthenticated && !isLoading && !loginInProgress) {
      const redirectPath = getRedirectPath();
      console.log('Already authenticated, redirecting to:', redirectPath);
      
      // Use replace to prevent back button from returning to login
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, loginInProgress]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginInProgress) return;
    
    setLoginInProgress(true);
    console.log('Login attempt for user:', username);
    
    try {
      // Using the new login function that handles token storage and redirect
      const success = await login(username, password);
      
      if (!success) {
        setLoginInProgress(false);
      }
      // Note: The login function now handles redirect on success
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
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

  // Show loading indicator while checking auth state
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block mb-2">Username</label>
              <Input 
                type="text" 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                disabled={loginInProgress}
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
                disabled={loginInProgress}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || loginInProgress}
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
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default Login;
