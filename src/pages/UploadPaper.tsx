
import React, { useState, useEffect } from "react";
import { uploadPaper, savePaper, saveQuestions, getAuthToken } from "@/services/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { FilePlus, RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ParsedQuestion } from "@/types/exam";

const UploadPaper = () => {
  const { isAuthenticated, redirectToLogin } = useAuth();
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Check authentication on component mount
  useEffect(() => {
    console.log('UploadPaper - Auth check:', isAuthenticated);
    console.log('Current token:', getAuthToken() ? 'Token exists' : 'No token');
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      redirectToLogin(location.pathname);
    }
  }, [isAuthenticated, redirectToLogin, location.pathname]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.type === "application/pdf" && selected.size <= 10 * 1024 * 1024) {
      setFile(selected);
      setError(null);
      console.log('File selected:', selected.name, 'Size:', selected.size);
    } else {
      setFile(null);
      setError("Please upload a valid PDF file under 10MB.");
      console.log('Invalid file selected');
    }
  };

  // Function to add debug info to the state
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => `${prev}\n${new Date().toISOString()}: ${info}`);
  };

  const handleUpload = async () => {
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      redirectToLogin(location.pathname);
      return;
    }
    
    setUploading(true);
    setError(null);
    addDebugInfo('Starting file upload');
    console.log('Starting file upload');
    
    // Verify token before upload
    const token = getAuthToken();
    addDebugInfo(`Token exists: ${!!token}`);
    if (token) {
      addDebugInfo(`Token format: ${token.substring(0, 10)}...`);
    }

    try {
      // Use the uploadPaper API function from services/api.ts
      addDebugInfo('Calling uploadPaper API');
      const result = await uploadPaper(file);
      console.log('Upload successful, parsed data received:', result);
      addDebugInfo('Upload successful');
      
      // Set the parsed data from the API response
      setParsedData(result);
      toast.success("Paper uploaded successfully");
    } catch (err: any) {
      console.error('Upload error:', err);
      addDebugInfo(`Upload error: ${err.message}`);
      
      if (err.message === "Unauthorized: Please login to upload papers") {
        console.log('Unauthorized, redirecting to login');
        addDebugInfo('Unauthorized, redirecting to login');
        redirectToLogin(location.pathname);
      } else {
        setError(err.message || "Upload failed.");
        toast.error(err.message || "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleApproveAndSave = async () => {
    if (!parsedData) {
      console.log('No parsed data to save');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      redirectToLogin(location.pathname);
      return;
    }

    try {
      console.log('Saving paper with data:', parsedData);
      // Create paper object with all required fields
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
        questions: [] // Empty array to satisfy type requirements
      };
      
      const savedPaper = await savePaper(paperData);
      console.log('Paper saved successfully:', savedPaper);

      // Access id from data property of the response
      const paperId = savedPaper.data.id;
      
      // Map questions to match the expected format
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
      
      console.log('Saving questions:', formattedQuestions);
      await saveQuestions(paperId, formattedQuestions);

      setParsedData(null);
      toast.success("Paper and questions saved successfully");
    } catch (err: any) {
      console.error('Save error:', err);
      if (err.message && err.message.includes("Unauthorized")) {
        redirectToLogin(location.pathname);
      } else {
        setError(err.message || "Failed to save paper.");
        toast.error(err.message || "Failed to save paper");
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="p-4 max-w-xl mx-auto mt-8">
        <Alert>
          You must be logged in to upload an exam paper.
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-4 max-w-xl mx-auto mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <Input type="file" accept=".pdf" onChange={handleFileChange} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button onClick={handleUpload} disabled={!file || uploading || !isAuthenticated}>
                  {uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </span>
            </TooltipTrigger>
            {!isAuthenticated && <TooltipContent>Login required</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}
      
      {/* Debug information section */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
        <p className="font-bold">Debug Info:</p>
        <pre>{debugInfo || 'No debug info yet'}</pre>
      </div>

      {parsedData && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Parsed Questions</h2>
          {parsedData.questions && parsedData.questions.length > 0 ? (
            parsedData.questions.map((q: any, idx: number) => (
              <Card key={idx} className="p-3 border">
                <p className="font-semibold">Q{idx + 1}: {q.question_text}</p>
                <p>Marks: {q.marks}</p>
                <p>Type: {q.question_type}</p>
                <p>Difficulty: {q.difficulty_level || 'Medium'}</p>
                <p>Section: {q.section || "N/A"}</p>
              </Card>
            ))
          ) : (
            <Alert>No questions found in the uploaded document.</Alert>
          )}
          <Button onClick={handleApproveAndSave}>
            Approve & Save
          </Button>
        </div>
      )}
    </Card>
  );
};

export default UploadPaper;
