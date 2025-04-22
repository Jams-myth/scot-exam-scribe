
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface LoginFormProps {
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  loginInProgress: boolean;
  apiStatus: 'checking' | 'online' | 'offline';
  error: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  isLoading,
  loginInProgress,
  apiStatus,
  error,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div>
        <label htmlFor="username" className="block mb-2">Username</label>
        <Input 
          type="text" 
          id="username"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
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
          onChange={(e) => onPasswordChange(e.target.value)}
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
  );
};
