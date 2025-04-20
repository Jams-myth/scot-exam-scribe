
import { getAuthToken } from './auth';
import { API_URL } from './api';

export interface UploadExamData {
  title: string;
  subject: string;
  grade_level: string;
  type: string;
  year: number;
  total_marks: number;
  description: string;
  pdf_url?: string;
  time_limit_minutes: number;
  duration: number;
}

export const uploadExamPaper = async (file: File, metadata: UploadExamData) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  
  // Ensure token has correct Bearer format
  const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  try {
    console.log('Uploading exam paper file...');
    
    // First upload the PDF file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "exam_papers"); // Optional: organize files in folders

    // This endpoint should be implemented in your Supabase function to handle file uploads
    const uploadResponse = await fetch(`${API_URL}/api/v1/papers/upload-pdf`, {
      method: "POST",
      headers: {
        'Authorization': authHeader
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload file: ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    const pdfUrl = uploadData.url;
    
    console.log('File uploaded successfully, saving paper metadata');
    
    // Now save the paper metadata with the PDF URL
    const paperData = {
      ...metadata,
      pdf_url: pdfUrl
    };

    const paperResponse = await fetch(`${API_URL}/api/v1/papers`, {
      method: "POST",
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paperData)
    });

    if (!paperResponse.ok) {
      const errorText = await paperResponse.text();
      throw new Error(`Failed to save paper metadata: ${errorText}`);
    }

    return await paperResponse.json();
  } catch (error) {
    console.error("Error in uploadExamPaper:", error);
    throw error;
  }
};
