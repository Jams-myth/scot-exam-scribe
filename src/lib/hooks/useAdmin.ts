
import { useEffect, useState } from 'react';
import { getAuthToken } from '@/services/auth';

// Simple function to check if a user is an admin based on JWT token
export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = () => {
      try {
        setIsCheckingAdmin(true);
        const token = getAuthToken();
        if (!token) {
          setIsAdmin(false);
          return;
        }

        // Decode JWT token
        const tokenPayload = token.includes('.') 
          ? JSON.parse(atob(token.split('.')[1]))
          : null;

        // Check if user email is admin@example.com
        if (tokenPayload && tokenPayload.email === 'admin@example.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  return { isAdmin, isCheckingAdmin };
};
