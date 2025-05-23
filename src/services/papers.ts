
import { Paper, ApiResponse, UploadResponse } from '@/types/exam';
import { API_URL } from './index';
import { getAuthToken } from './auth';

export const fetchPapers = async (): Promise<Paper[]> => {
  const token = getAuthToken();
  
  try {
    console.log('Fetching papers from:', `${API_URL}/api/v1/papers/`);
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Add authorization header if token exists
    if (token) {
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      headers['Authorization'] = authHeader;
      console.log('Using auth token format:', authHeader.substring(0, 20) + '...');
    } else {
      console.warn('No auth token available for papers fetch');
    }

    const response = await fetch(`${API_URL}/api/v1/papers/`, { headers });
    
    if (!response.ok) {
      console.error('Papers API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Papers data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching papers:', error);
    throw new Error('Failed to load exams. Please try again.');
  }
};

export const fetchPaper = async (id: string): Promise<Paper> => {
  const token = getAuthToken();
  
  // Ensure token has correct Bearer format if it exists
  const headers: Record<string, string> = {};
  if (token) {
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    headers["Authorization"] = authHeader;
  }
  
  const response = await fetch(`${API_URL}/papers/${id}`, { headers });
  
  if (!response.ok) throw new Error("Failed to fetch paper");
  return response.json();
};

export const uploadPaper = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required: Please login to upload papers");
  }
  
  // Validate token format
  if (token.indexOf('.') === -1) {
    console.error('Invalid token format:', token.substring(0, 20) + '...');
    throw new Error("Invalid authentication token format. Please login again.");
  }
  
  try {
    // Log upload attempt details
    const uploadUrl = `${API_URL}/papers/pdf`;
    console.log('Upload API URL:', uploadUrl);
    console.log('Auth token format check:', token.substring(0, 20) + '...');
    
    // Ensure token has correct Bearer format
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Enhanced request logging
    const requestDetails = {
      url: uploadUrl,
      method: 'POST',
      headers: {
        Authorization: authHeader.substring(0, 25) + '...'
      },
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name
    };
    console.log('Request details:', JSON.stringify(requestDetails));
    
    // Make the request with proper error handling
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        'Authorization': authHeader
      },
      body: formData,
      credentials: 'include', // Include cookies if they're used for auth
    });
    
    // Log the response details for debugging
    console.log('Upload response status:', response.status);
    console.log('Upload response statusText:', response.statusText);
    console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()])));
    
    if (!response.ok) {
      // Get detailed error information
      let errorDetail = '';
      try {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.detail || errorJson.message || errorText;
        } catch (e) {
          errorDetail = errorText;
        }
      } catch (e) {
        errorDetail = 'Could not read error details';
      }
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error(`Unauthorized: Please login to upload papers (${errorDetail})`);
      } else if (response.status === 403) {
        throw new Error(`Forbidden: ${errorDetail || "You don't have permission to upload papers"}`);
      } else if (response.status === 500) {
        throw new Error(`Server error: ${errorDetail || "The upload could not be processed"}`);
      } else {
        throw new Error(`Upload failed (${response.status}): ${errorDetail || response.statusText}`);
      }
    }
    
    // Return the parsed JSON response
    return response.json();
  } catch (error: any) {
    // Enhanced error logging
    console.error("API Error in uploadPaper:", error);
    
    // If it's a network error, add more context and check CORS
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      const corsError = error.message.includes('CORS') || error.message.includes('cors');
      const errorMessage = corsError 
        ? `CORS error: The server at ${API_URL} does not allow requests from this domain. Please check CORS settings.`
        : `Network error: Could not connect to API server at ${API_URL}. Check your internet connection or if the server is running.`;
      
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    throw error;
  }
};

export const savePaper = async (paper: Omit<Paper, "id">): Promise<ApiResponse<Paper>> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  
  // Ensure token has correct Bearer format
  const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  
  const response = await fetch(`${API_URL}/papers`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": authHeader
    },
    body: JSON.stringify(paper),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save paper: ${errorText}`);
  }
  return response.json();
};
