
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
    setLoginInProgress(true);
    
    try {
      // For demo purposes, we'll still check for admin/password,
      // but generate a more realistic JWT-like token
      if (username === 'admin' && password === 'password') {
        console.log('Login successful');
        
        // Create a more realistic looking JWT token (still for demo purposes)
        // A real JWT has three parts separated by dots: header.payload.signature
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const payload = btoa(JSON.stringify({ 
          sub: username, 
          name: "Admin User", 
          role: "admin",
          exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
        }));
        const signature = btoa("demo-signature"); // In a real JWT this would be cryptographically generated
        
        const token = `${header}.${payload}.${signature}`;
        console.log(`Generated JWT-like token: ${token.substring(0, 15)}...`);
        
        await login(token);
      } else {
        console.log('Invalid credentials');
        toast.error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    } finally {
      setLoginInProgress(false);
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
            <Button type="submit" className="w-full" disabled={isLoading || loginInProgress}>
              {loginInProgress ? 'Logging in...' : isLoading ? 'Loading...' : 'Login'}
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
              apiUrl: API_URL,
              hasToken: !!localStorage.getItem('authToken'),
              tokenPreview: localStorage.getItem('authToken') 
                ? `${localStorage.getItem('authToken')?.substring(0, 15)}...` 
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
