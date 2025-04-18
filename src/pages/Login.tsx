
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = () => {
    const urlParams = new URLSearchParams(location.search);
    const redirectPath = urlParams.get('redirect') || localStorage.getItem('redirectAfterLogin') || '/';
    console.log('Login - Redirect path:', redirectPath);
    return redirectPath;
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirectPath = getRedirectPath();
      console.log('Already authenticated, redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt for user:', username);
    
    try {
      if (username === 'admin' && password === 'password') {
        console.log('Login successful');
        const token = `dummy-auth-token-for-${username}-user`;
        console.log(`Generated token: ${token.substring(0, 10)}...`);
        await login(token);
      } else {
        console.log('Invalid credentials');
        toast.error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    }
  };

  const toggleDebug = () => setShowDebug(!showDebug);

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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        className="mt-4"
        onClick={toggleDebug}
      >
        {showDebug ? 'Hide' : 'Show'} Debug Info
      </Button>

      {showDebug && (
        <Card className="w-full max-w-md mt-4 p-4">
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify({
              isAuthenticated,
              isLoading,
              redirectPath: getRedirectPath(),
              currentPath: location.pathname,
              hasToken: !!localStorage.getItem('authToken'),
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default Login;
