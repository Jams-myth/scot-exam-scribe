
import { Paper, ParsedQuestion, UploadResponse, ApiResponse } from "@/types/exam";

// API base URL
export const API_URL = "https://preview--exam-vault-api.lovable.app";

export const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  console.log('Getting auth token:', token ? `${token.substring(0, 15)}...` : 'null');
  return token;
};

export const isAuthenticated = () => {
  const isAuth = !!getAuthToken();
  console.log('isAuthenticated check:', isAuth);
  return isAuth;
};

export const uploadPaper = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required: Please login to upload papers");
  }
  
  try {
    // Log upload attempt details
    const uploadUrl = `${API_URL}/papers/pdf`;
    console.log('Upload API URL:', uploadUrl);
    console.log('Auth token format check:', token.substring(0, 15) + '...');
    
    // Log request headers for debugging
    const headers: Record<string, string> = {
      'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
    };
    console.log('Request headers:', JSON.stringify(headers));
    
    // Make the request with proper error handling
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: headers,
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
    // Log the error for debugging
    console.error("API Error in uploadPaper:", error);
    
    // If it's a network error, add more context
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error("Network error: Could not connect to API server. Check your internet connection or if the server is running.");
    }
    
    throw error;
  }
};

export const savePaper = async (paper: Omit<Paper, "id">): Promise<ApiResponse<Paper>> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  
  const response = await fetch(`${API_URL}/papers`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(paper),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save paper: ${errorText}`);
  }
  return response.json();
};

export const saveQuestions = async (paperId: string, questions: Omit<ParsedQuestion, "id">[]): Promise<ApiResponse<ParsedQuestion[]>> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  
  const response = await fetch(`${API_URL}/questions`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ paperId, questions }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save questions: ${errorText}`);
  }
  return response.json();
};

export const fetchPapers = async (): Promise<Paper[]> => {
  const token = getAuthToken();
  
  const response = await fetch(`${API_URL}/papers`, {
    headers: token ? { "Authorization": `Bearer ${token}` } : {}
  });
  
  if (!response.ok) throw new Error("Failed to fetch papers");
  return response.json();
};

export const fetchPaper = async (id: string): Promise<Paper> => {
  const token = getAuthToken();
  
  const response = await fetch(`${API_URL}/papers/${id}`, {
    headers: token ? { "Authorization": `Bearer ${token}` } : {}
  });
  
  if (!response.ok) throw new Error("Failed to fetch paper");
  return response.json();
};
