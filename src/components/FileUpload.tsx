
import React, { useState } from 'react';
import { FilePlus, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert } from './ui/alert';
import { toast } from 'sonner';
import { Paper, ParsedQuestion } from '@/types/exam';
import { uploadPaper, savePaper, saveQuestions } from '@/services/api';

interface FileUploadProps {
  isAuthenticated: boolean;
  addDebugInfo: (info: string) => void;
  setLastNetworkRequest: (request: any) => void;
}

const FileUpload = ({ isAuthenticated, addDebugInfo, setLastNetworkRequest }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.type === "application/pdf" && selected.size <= 10 * 1024 * 1024) {
      setFile(selected);
      setError(null);
      addDebugInfo(`File selected: ${selected.name} (${(selected.size / 1024).toFixed(2)} KB)`);
    } else {
      setFile(null);
      setError("Please upload a valid PDF file under 10MB.");
      addDebugInfo('Invalid file selected - must be PDF under 10MB');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      addDebugInfo('Error: No file selected');
      return;
    }
    
    setUploading(true);
    setError(null);
    addDebugInfo('Starting file upload process');
    
    try {
      const result = await uploadPaper(file);
      addDebugInfo('Upload successful!');
      addDebugInfo(`Response: ${JSON.stringify(result, null, 2).substring(0, 200)}...`);
      
      setParsedData(result);
      toast.success("Paper uploaded successfully");
    } catch (err: any) {
      const errorMessage = err.message || "Upload failed.";
      addDebugInfo(`Upload error: ${errorMessage}`);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleApproveAndSave = async () => {
    if (!parsedData) {
      return;
    }

    try {
      const paperData = {
        title: parsedData.title,
        subject: parsedData.subject,
        year: parsedData.year || new Date().getFullYear(),
        type: parsedData.type || "Exam",
        duration: parsedData.time_limit_minutes || 60,
        total_marks: parsedData.total_marks,
        description: parsedData.description,
        time_limit_minutes: parsedData.time_limit_minutes,
        grade_level: parsedData.grade_level,
        questions: []
      };
      
      const savedPaper = await savePaper(paperData);
      const paperId = savedPaper.data.id;
      
      const formattedQuestions = parsedData.questions.map((q: any) => ({
        text: q.question_text || "",
        type: q.question_type || "Essay",
        points: q.marks || 0,
        correctAnswer: "",
        section: q.section || "",
        difficulty_level: q.difficulty_level || "Medium",
        marking_scheme: q.marking_scheme || "",
        diagrams: q.diagrams || []
      }));
      
      await saveQuestions(paperId, formattedQuestions);
      setParsedData(null);
      toast.success("Paper and questions saved successfully");
    } catch (err: any) {
      setError(err.message || "Failed to save paper.");
      toast.error(err.message || "Failed to save paper");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input type="file" accept=".pdf" onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={!file || uploading || !isAuthenticated}>
          {uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {parsedData && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Parsed Questions</h2>
          {parsedData.questions && parsedData.questions.length > 0 ? (
            parsedData.questions.map((q: any, idx: number) => (
              <div key={idx} className="p-3 border rounded">
                <p className="font-semibold">Q{idx + 1}: {q.question_text}</p>
                <p>Marks: {q.marks}</p>
                <p>Type: {q.question_type}</p>
                <p>Difficulty: {q.difficulty_level || 'Medium'}</p>
                <p>Section: {q.section || "N/A"}</p>
              </div>
            ))
          ) : (
            <Alert>No questions found in the uploaded document.</Alert>
          )}
          <Button onClick={handleApproveAndSave}>
            Approve & Save
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
