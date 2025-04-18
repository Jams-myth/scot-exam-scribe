
export interface ParsedQuestion {
  id: string;
  text: string;
  type: "MCQ" | "Essay" | "Short Answer";
  points: number;
  section?: string;
  options?: string[];
  correctAnswer: string;
  question_text?: string;  // Added to fix type error
  question_type?: string;  // Added for consistency
  marks?: number;  // Added for consistency
  difficulty_level?: string;  // Added for consistency
  marking_scheme?: string;  // Added for consistency
  diagrams?: string[];  // Added for consistency
}

export interface Paper {
  id: string;
  title: string;
  subject: string;
  year: number;
  type: string;
  duration: number;
  questions: ParsedQuestion[];
  grade_level?: string;  // Added to fix type error
  total_marks?: number;  // Added for consistency
  description?: string;  // Added for consistency
  time_limit_minutes?: number;  // Added for consistency
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
