
import { useState, useEffect } from 'react';
import { API_URL } from '@/services/api';

export const useApiStatus = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        setApiStatus('checking');
        
        // Try multiple endpoints to confirm API status
        const healthEndpoint = `${API_URL}/api/v1/auth/dev-token`;
        const fallbackEndpoint = `${API_URL}/api/v1/auth/users/me`;

        
        console.log(`Checking API status at: ${healthEndpoint}`);
        
        // Use AbortController to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch(healthEndpoint, { 
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
            // Don't include credentials to avoid CORS preflight
            mode: 'cors',
            cache: 'no-cache',
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log('API health check succeeded');
            setApiStatus('online');
            return;
          }
          
          console.log(`API health check failed with status: ${response.status}`);
        } catch (healthError) {
          clearTimeout(timeoutId);
          console.log('Primary health endpoint failed, trying fallback:', healthError);
          
          // Try fallback endpoint
          try {
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
            
            const response = await fetch(fallbackEndpoint, {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              signal: controller2.signal,
              mode: 'cors',
              cache: 'no-cache',
            });
            
            clearTimeout(timeoutId2);
            
            if (response.ok) {
              console.log('API fallback health check succeeded');
              setApiStatus('online');
              return;
            }
          } catch (fallbackError) {
            // Fix: Use the correct variable name timeoutId2 here
            const timeoutId2 = setTimeout(() => {}, 0); // Define a dummy one if needed
            clearTimeout(timeoutId2);
            console.log('Fallback health endpoint also failed:', fallbackError);
          }
        }
        
        // If we reach here, both attempts failed
        setApiStatus('offline');
      } catch (error) {
        console.error('API status check failed:', error);
        setApiStatus('offline');
      }
    };
    
    // Check immediately on mount
    checkApiStatus();
    
    // Re-check every 30 seconds
    const intervalId = setInterval(checkApiStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return apiStatus;
};
