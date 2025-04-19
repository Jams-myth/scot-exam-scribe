
export interface ParsedQuestion {
  id: string;
  text: string;
  type: "MCQ" | "Essay" | "Short Answer";
  points: number;
  section?: string;
  options?: string[];
  correctAnswer: string;
  question_text?: string;
  question_type?: string;
  marks?: number;
  difficulty_level?: string;
  marking_scheme?: string;
  diagrams?: string[];
  paper_id?: string;
}

export interface Paper {
  id: string;
  title: string;
  subject: string;
  year: number;
  type: string;
  duration: number;
  questions: ParsedQuestion[];
  grade_level?: string;
  total_marks?: number;
  description?: string;
  time_limit_minutes?: number;
  created_at?: string;
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
