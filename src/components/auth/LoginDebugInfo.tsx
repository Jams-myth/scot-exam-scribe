
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LoginDebugInfoProps {
  showDebug: boolean;
  debugData: {
    isAuthenticated: boolean;
    isLoading: boolean;
    loginInProgress: boolean;
    redirectPath: string;
    currentPath: string;
    apiUrl: string;
    hasToken: boolean;
    tokenPreview: string;
  };
  onToggleDebug: () => void;
  onClearToken: () => void;
}

export const LoginDebugInfo: React.FC<LoginDebugInfoProps> = ({
  showDebug,
  debugData,
  onToggleDebug,
  onClearToken,
}) => {
  if (!showDebug) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2 mt-4">
        <Button
          variant="ghost"
          onClick={onToggleDebug}
        >
          Hide Debug Info
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onClearToken}
          className="text-red-500"
        >
          Clear Token
        </Button>
      </div>

      <Card className="w-full max-w-md mt-4 p-4">
        <pre className="text-xs whitespace-pre-wrap">
          {JSON.stringify({
            ...debugData,
            timestamp: new Date().toISOString(),
          }, null, 2)}
        </pre>
      </Card>
    </>
  );
};
