
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { useLocation } from "react-router-dom";
import FileUpload from "@/components/FileUpload";
import DebugPanel from "@/components/DebugPanel";
import { getAuthToken } from "@/services/api";

const UploadPaper = () => {
  const { isAuthenticated, redirectToLogin } = useAuth();
  const location = useLocation();
  const [showDebug, setShowDebug] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [lastNetworkRequest, setLastNetworkRequest] = useState<any>(null);

  useEffect(() => {
    const token = getAuthToken();
    addDebugInfo(`Auth check: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    addDebugInfo(`Token exists: ${!!token}`);
    if (token) {
      addDebugInfo(`Token format: ${token.substring(0, 20)}...`);
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          addDebugInfo(`Token payload: ${JSON.stringify(payload)}`);
          if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            addDebugInfo(`Token expires: ${expDate.toLocaleString()}`);
          }
        }
      } catch (err) {
        addDebugInfo(`Error parsing token: ${err}`);
      }
    }
    
    if (!isAuthenticated) {
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
