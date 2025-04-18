
export interface ParsedQuestion {
  id: string;
  text: string;
  type: "MCQ" | "Essay" | "Short Answer";
  points: number;
  section?: string;
  options?: string[];
  correctAnswer: string;
}

export interface Paper {
  id: string;
  title: string;
  subject: string;
  year: number;
  type: string;
  duration: number;
  questions: ParsedQuestion[];
}

export interface UploadResponse {
  success: boolean;
  questions: ParsedQuestion[];
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
