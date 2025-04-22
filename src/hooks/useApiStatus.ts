
import { useState, useEffect } from 'react';
import { API_URL } from '@/services/api';

export const useApiStatus = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        setApiStatus('checking');
        const response = await fetch(`${API_URL}/health`, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        setApiStatus(response.ok ? 'online' : 'offline');
        console.log(`API health check result: ${response.ok ? 'online' : 'offline'}`);
      } catch (error) {
        console.error('API status check failed:', error);
        setApiStatus('offline');
      }
    };
    
    checkApiStatus();
    const intervalId = setInterval(checkApiStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return apiStatus;
};
