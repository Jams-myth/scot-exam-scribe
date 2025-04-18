
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { useLocation } from "react-router-dom";
import FileUpload from "@/components/FileUpload";
import DebugPanel from "@/components/DebugPanel";
import { getAuthToken, API_URL } from "@/services/api";

const UploadPaper = () => {
  const { isAuthenticated, redirectToLogin } = useAuth();
  const location = useLocation();
  const [showDebug, setShowDebug] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [lastNetworkRequest, setLastNetworkRequest] = useState<any>(null);

  useEffect(() => {
    // Listen for debug-log events from other components
    const handleDebugLog = (event: CustomEvent) => {
      addDebugInfo(event.detail);
    };

    window.addEventListener('debug-log' as any, handleDebugLog as any);
    return () => {
      window.removeEventListener('debug-log' as any, handleDebugLog as any);
    };
  }, []);

  useEffect(() => {
    // Initialize debug information
    addDebugInfo(`App initialized, using API: ${API_URL}`);
    
    const token = getAuthToken();
    addDebugInfo(`Auth check: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    addDebugInfo(`Token exists: ${!!token}`);

    // Test if we can reach the API
    const testConnection = async () => {
      try {
        addDebugInfo(`Testing API connection to ${API_URL}...`);
        const response = await fetch(`${API_URL}/health`, { 
          method: 'GET', 
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const status = `${response.status} ${response.statusText}`;
        addDebugInfo(`API connection test result: ${status}`);
        
        if (response.ok) {
          try {
            const data = await response.json();
            addDebugInfo(`API health check response: ${JSON.stringify(data)}`);
          } catch (e) {
            addDebugInfo(`API responded but with invalid JSON`);
          }
        }
      } catch (err) {
        addDebugInfo(`API connection test failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    testConnection();
    
    if (token) {
      addDebugInfo(`Token format: ${token.substring(0, 20)}...`);
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          addDebugInfo(`Token payload: ${JSON.stringify(payload)}`);
          if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            const now = new Date();
            const timeLeft = Math.floor((expDate.getTime() - now.getTime()) / 1000 / 60);
            addDebugInfo(`Token expires: ${expDate.toLocaleString()} (${timeLeft} minutes remaining)`);
          }
        }
      } catch (err) {
        addDebugInfo(`Error parsing token: ${err}`);
      }
    }
    
    if (!isAuthenticated) {
      addDebugInfo(`Not authenticated, redirecting to login`);
      redirectToLogin(location.pathname);
    }
  }, [isAuthenticated, redirectToLogin, location.pathname]);

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setDebugInfo(prev => `${prev}\n[${timestamp}] ${info}`);
  };

  const clearDebugInfo = () => {
    setDebugInfo('');
    addDebugInfo('Debug log cleared');
  };

  const forceTokenRefresh = () => {
    localStorage.removeItem('authToken');
    addDebugInfo('Auth token forcibly removed, reloading page...');
    setTimeout(() => window.location.reload(), 500);
  };

  if (!isAuthenticated) {
    return (
      <Card className="p-4 max-w-xl mx-auto mt-8">
        <Alert>
          You must be logged in to upload an exam paper.
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-4 max-w-xl mx-auto mt-8 space-y-4">
      <FileUpload 
        isAuthenticated={isAuthenticated}
        addDebugInfo={addDebugInfo}
        setLastNetworkRequest={setLastNetworkRequest}
      />
      
      <DebugPanel 
        debugInfo={debugInfo}
        onClearDebug={clearDebugInfo}
        onForceTokenRefresh={forceTokenRefresh}
        lastNetworkRequest={lastNetworkRequest}
        showDebug={showDebug}
        onToggleDebug={() => setShowDebug(!showDebug)}
      />
    </Card>
  );
};

export default UploadPaper;
