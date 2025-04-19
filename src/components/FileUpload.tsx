
import React, { useState } from 'react';
import { FilePlus, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert } from './ui/alert';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Paper, ParsedQuestion } from '@/types/exam';
import { uploadPaper, savePaper } from '@/services/papers';
import { saveQuestions } from '@/services/questions';
import { API_URL } from '@/services/index';

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
  const [savedPaperId, setSavedPaperId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.type === "application/pdf" && selected.size <= 10 * 1024 * 1024) {
      setFile(selected);
      setError(null);
      setSavedPaperId(null);
      setSaveSuccess(false);
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
    setSavedPaperId(null);
    setSaveSuccess(false);
    
    // Update the last network request with initial details
    setLastNetworkRequest({
      url: `${API_URL}/papers/pdf`,
      method: 'POST',
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      timestamp: new Date().toISOString(),
      status: 'Sending request...'
    });
    
    addDebugInfo('Starting file upload process');
    addDebugInfo(`Target API: ${API_URL}/papers/pdf`);
    
    try {
      const result = await uploadPaper(file);
      
      // Update network request with success details
      setLastNetworkRequest((prev: any) => ({
        ...prev,
        status: 'Success',
        statusCode: 200,
        timestamp: new Date().toISOString(),
        responseData: result
      }));
      
      addDebugInfo('Upload successful!');
      addDebugInfo(`Response: ${JSON.stringify(result, null, 2).substring(0, 200)}...`);
      
      setParsedData(result);
      toast.success("Paper uploaded successfully");
    } catch (err: any) {
      const errorMessage = err.message || "Upload failed.";
      
      // Update network request with error details
      setLastNetworkRequest((prev: any) => ({
        ...prev,
        status: 'Failed',
        error: errorMessage,
        errorDetails: err.toString(),
        timestamp: new Date().toISOString()
      }));
      
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
      
      // Update network request with save operation details
      setLastNetworkRequest({
        url: `${API_URL}/papers`,
        method: 'POST',
        timestamp: new Date().toISOString(),
        status: 'Sending request...',
        paperData: { ...paperData, questions: `${parsedData.questions.length} questions` }
      });
      
      addDebugInfo(`Saving paper to API: ${API_URL}/papers`);
      const savedPaper = await savePaper(paperData);
      const paperId = savedPaper.data.id;
      setSavedPaperId(paperId);
      
      // Update network request with questions save operation
      setLastNetworkRequest((prev: any) => ({
        ...prev,
        url: `${API_URL}/questions`,
        status: 'Saving questions...',
        paperId: paperId,
        timestamp: new Date().toISOString()
      }));
      
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
      
      addDebugInfo(`Saving ${formattedQuestions.length} questions to API: ${API_URL}/questions`);
      await saveQuestions(paperId, formattedQuestions);
      
      // Update network request with success status
      setLastNetworkRequest((prev: any) => ({
        ...prev,
        status: 'Success',
        timestamp: new Date().toISOString()
      }));
      
      setSaveSuccess(true);
      toast.success("Paper and questions saved successfully");
    } catch (err: any) {
      // Update network request with error details
      setLastNetworkRequest((prev: any) => ({
        ...prev,
        status: 'Failed',
        error: err.message || "Failed to save paper.",
        timestamp: new Date().toISOString()
      }));
      
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

      {saveSuccess && savedPaperId && (
        <Alert>
          <div className="flex flex-col space-y-2">
            <p className="font-medium text-green-600">Paper saved successfully!</p>
            <div className="flex space-x-4 mt-2">
              <Link to={`/questions?paperId=${savedPaperId}`}>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Questions
                </Button>
              </Link>
              <Link to="/papers">
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View All Papers
                </Button>
              </Link>
            </div>
          </div>
        </Alert>
      )}

      {parsedData && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Paper Details</h2>
          <div className="p-3 border rounded space-y-1">
            <p><strong>Title:</strong> {parsedData.title || 'N/A'}</p>
            <p><strong>Subject:</strong> {parsedData.subject || 'N/A'}</p>
            <p><strong>Grade Level:</strong> {parsedData.grade_level || 'N/A'}</p>
            <p><strong>Total Marks:</strong> {parsedData.total_marks || 'N/A'}</p>
            <p><strong>Questions:</strong> {parsedData.questions?.length || 0}</p>
          </div>
          
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
          
          {!saveSuccess && (
            <Button onClick={handleApproveAndSave}>
              Approve & Save
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
