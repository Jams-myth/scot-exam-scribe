
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ApiStatusProps {
  status: 'checking' | 'online' | 'offline';
  url: string;
}

export const ApiStatus: React.FC<ApiStatusProps> = ({ status, url }) => {
  if (status === 'offline') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          API server appears to be offline or unreachable. Login may not work until the server is available.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <p className="text-xs text-gray-500 mt-2">
      API: {status === 'checking' ? 'Checking...' : status === 'online' ? 'Online' : 'Offline'} - {url}
    </p>
  );
};
