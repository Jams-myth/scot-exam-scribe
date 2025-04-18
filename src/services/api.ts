import { Paper, ParsedQuestion, UploadResponse, ApiResponse } from "@/types/exam";

const API_URL = "https://exam-vault-api.onrender.com/api/v1";

export const getAuthToken = () => localStorage.getItem('authToken');
export const isAuthenticated = () => !!getAuthToken();

export const uploadPaper = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required: Please login to upload papers");
  }
  
  const response = await fetch(`${API_URL}/papers/pdf`, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please login to upload papers");
    } else if (response.status === 403) {
      throw new Error("Forbidden: You don't have permission to upload papers");
    } else if (response.status === 500) {
      throw new Error("Server error: The upload could not be processed");
    } else {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }
  }
  
  return response.json();
};

export const savePaper = async (paper: Omit<Paper, "id">): Promise<ApiResponse<Paper>> => {
  const response = await fetch(`${API_URL}/papers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paper),
  });
  
  if (!response.ok) throw new Error("Failed to save paper");
  return response.json();
};

export const saveQuestions = async (paperId: string, questions: Omit<ParsedQuestion, "id">[]): Promise<ApiResponse<ParsedQuestion[]>> => {
  const response = await fetch(`${API_URL}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paperId, questions }),
  });
  
  if (!response.ok) throw new Error("Failed to save questions");
  return response.json();
};

export const fetchPapers = async (): Promise<Paper[]> => {
  const response = await fetch(`${API_URL}/papers`);
  if (!response.ok) throw new Error("Failed to fetch papers");
  return response.json();
};

export const fetchPaper = async (id: string): Promise<Paper> => {
  const response = await fetch(`${API_URL}/papers/${id}`);
  if (!response.ok) throw new Error("Failed to fetch paper");
  return response.json();
};
