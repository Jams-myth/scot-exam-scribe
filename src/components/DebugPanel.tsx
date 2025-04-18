
import React, { useState } from 'react';
import { Bug, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface DebugPanelProps {
  debugInfo: string;
  onClearDebug: () => void;
  onForceTokenRefresh: () => void;
  lastNetworkRequest?: any;
  showDebug: boolean;
  onToggleDebug: () => void;
}

const DebugPanel = ({
  debugInfo,
  onClearDebug,
  onForceTokenRefresh,
  lastNetworkRequest,
  showDebug,
  onToggleDebug,
}: DebugPanelProps) => {
  if (!showDebug) {
    return (
      <Button variant="outline" size="icon" onClick={onToggleDebug} title="Toggle Debug Info">
        <Bug className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto max-h-60 border border-gray-300 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <p className="font-bold">Debug Information:</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClearDebug}>
            Clear Log
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onForceTokenRefresh}
            className="text-red-500"
          >
            <Trash2 className="h-3 w-3 mr-1" /> Reset Token
          </Button>
          <Button variant="outline" size="icon" onClick={onToggleDebug}>
            <Bug className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-1 mb-2">
        {lastNetworkRequest && (
          <>
            <p className="font-bold mt-2">Last Request:</p>
            <pre className="whitespace-pre-wrap bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">
              {JSON.stringify(lastNetworkRequest, null, 2)}
            </pre>
          </>
        )}
      </div>
      
      <p className="font-bold mt-2">Log:</p>
      <pre className="whitespace-pre-wrap">{debugInfo || 'No log entries yet'}</pre>
    </div>
  );
};

export default DebugPanel;
