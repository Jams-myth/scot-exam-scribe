import { useState, useEffect } from 'react';
import { API_URL } from '@/services/api';

export const useApiStatus = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        setApiStatus('checking');
        
        const healthEndpoint = `${API_URL}/api/v1/auth/dev-token`;
        const fallbackEndpoint = `${API_URL}/api/v1/auth/users/me`;

        console.log(`Checking API status at: ${healthEndpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch(healthEndpoint, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
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

          try {
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 5000);

            const token = localStorage.getItem('exam_vault_token');
            const headers: HeadersInit = { 'Accept': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(fallbackEndpoint, {
              method: 'GET',
              headers,
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
            const timeoutId2 = setTimeout(() => {}, 0);
            clearTimeout(timeoutId2);
            console.log('Fallback health endpoint also failed:', fallbackError);
          }
        }

        setApiStatus('offline');
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
