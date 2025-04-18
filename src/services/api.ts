
import { Paper, ParsedQuestion, UploadResponse, ApiResponse } from "@/types/exam";

const API_URL = "https://exam-vault-api.onrender.com/api/v1";

export const uploadPaper = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${errorText}`);
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
