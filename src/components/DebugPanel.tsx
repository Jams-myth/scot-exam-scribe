
import React, { useState } from 'react';
import { Bug, Trash2, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { API_URL } from '@/services/api';

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
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);

  if (!showDebug) {
    return (
      <Button variant="outline" size="icon" onClick={onToggleDebug} title="Toggle Debug Info">
        <Bug className="h-4 w-4" />
      </Button>
    );
  }

  const testConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/health`, { 
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const statusText = response.ok ? 'healthy' : 'unhealthy';
      const message = `API connection test: ${statusText} (${response.status} ${response.statusText})`;
      
      // Add the test result to the debug info
      const event = new CustomEvent('debug-log', { detail: message });
      window.dispatchEvent(event);
      
      return response.ok;
    } catch (error) {
      const message = `API connection test failed: ${error instanceof Error ? error.message : String(error)}`;
      
      // Add the error to the debug info
      const event = new CustomEvent('debug-log', { detail: message });
      window.dispatchEvent(event);
      
      return false;
    }
  };

  return (
    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto max-h-80 border border-gray-300 dark:border-gray-700">
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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={testConnection}
            className="text-blue-500"
          >
            <RefreshCcw className="h-3 w-3 mr-1" /> Test API
          </Button>
          <Button variant="outline" size="icon" onClick={onToggleDebug}>
            <Bug className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-1 mb-2">
        {lastNetworkRequest && (
          <>
            <div className="flex items-center justify-between">
              <p className="font-bold mt-2">Last Request:</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNetworkDetails(!showNetworkDetails)}
                className="text-xs"
              >
                {showNetworkDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showNetworkDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
            
            <Card className="bg-gray-200 dark:bg-gray-700 p-1 rounded">
              <div className="text-xs font-semibold">
                <p>API URL: {API_URL}</p>
                <p>Endpoint: {lastNetworkRequest.url || 'N/A'}</p>
                <p>Status: {lastNetworkRequest.status || 'Pending'}</p>
                {lastNetworkRequest.error && <p className="text-red-500">Error: {lastNetworkRequest.error}</p>}
              </div>
              
              {showNetworkDetails && (
                <div className="mt-2">
                  <p className="font-semibold">Full Details:</p>
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(lastNetworkRequest, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
      
      <p className="font-bold mt-2">Log:</p>
      <pre className="whitespace-pre-wrap">{debugInfo || 'No log entries yet'}</pre>
    </div>
  );
};

export default DebugPanel;
