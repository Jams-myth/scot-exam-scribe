
import { ParsedQuestion, ApiResponse } from '@/types/exam';
import { API_URL } from './index';
import { getAuthToken } from './auth';

export const fetchAllQuestions = async (paperId?: string): Promise<ParsedQuestion[]> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  
  try {
    // Build URL with optional paperId filter
    let url = `${API_URL}/api/v1/questions/`;
    if (paperId) {
      url += `?paper_id=${paperId}`;
    }
    
    console.log('Fetching questions from URL:', url);
    console.log('Using auth token format:', authHeader.substring(0, 20) + '...');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Questions API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`Failed to fetch questions: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched questions:', data);
    return data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const saveQuestions = async (paperId: string, questions: Omit<ParsedQuestion, "id">[]): Promise<ApiResponse<ParsedQuestion[]>> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  
  // Ensure token has correct Bearer format
  const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  
  const response = await fetch(`${API_URL}/questions`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": authHeader
    },
    body: JSON.stringify({ paperId, questions }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save questions: ${errorText}`);
  }
  return response.json();
};
