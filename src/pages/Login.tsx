import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { API_URL } from '@/services/api';
import { loginUser } from '@/services/auth';
import { ApiStatus } from '@/components/auth/ApiStatus';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoginDebugInfo } from '@/components/auth/LoginDebugInfo';
import { useApiStatus } from '@/hooks/useApiStatus';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { isAuthenticated, isLoading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const apiStatus = useApiStatus();
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
          {apiStatus === 'offline' && <ApiStatus status={apiStatus} url={API_URL} />}
          
          <LoginForm
            username={username}
            password={password}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
            isLoading={isLoading}
            loginInProgress={loginInProgress}
            apiStatus={apiStatus}
            error={loginError}
          />
        </CardContent>
        <CardFooter>
          <ApiStatus status={apiStatus} url={API_URL} />
        </CardFooter>
      </Card>

      <Button
        variant="ghost"
        onClick={() => setShowDebug(!showDebug)}
        className="mt-4"
      >
        {showDebug ? 'Hide' : 'Show'} Debug Info
      </Button>

      <LoginDebugInfo
        showDebug={showDebug}
        debugData={{
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
        }}
        onToggleDebug={() => setShowDebug(!showDebug)}
        onClearToken={clearToken}
      />
    </div>
  );
};

export default Login;
