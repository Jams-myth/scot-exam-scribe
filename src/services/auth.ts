
import { API_URL } from './index';

export const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  return token;
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

export const loginUser = async (username: string, password: string) => {
  try {
    // Format payload as x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    console.log(`Attempting login for user: ${username} to ${API_URL}/api/v1/auth/login/access-token`);
    
    const response = await fetch(`${API_URL}/api/v1/auth/login/access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login response error:', response.status, errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || errorData.detail || 'Login failed');
      } catch (parseError) {
        throw new Error(`Login failed (${response.status}): ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('Login successful, received token');
    
    // Extract the access_token from the response
    if (!data.access_token) {
      throw new Error('Invalid response format: missing access token');
    }
    
    return data.access_token;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('redirectAfterLogin');
};
