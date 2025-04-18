
import React, { useState, useEffect } from "react";
import { uploadPaper, savePaper, saveQuestions, getAuthToken, API_URL } from "@/services/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { FilePlus, RefreshCw, Bug, Trash2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ParsedQuestion } from "@/types/exam";

const UploadPaper = () => {
  const { isAuthenticated, redirectToLogin, authToken } = useAuth();
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [showDebug, setShowDebug] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [lastNetworkRequest, setLastNetworkRequest] = useState<any>(null);

  useEffect(() => {
    console.log('UploadPaper - Auth check:', isAuthenticated);
    const token = getAuthToken();
    console.log('Current token:', token ? `${token.substring(0, 20)}...` : 'No token');
    addDebugInfo(`Auth check: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    addDebugInfo(`Token exists: ${!!token}`);
    if (token) {
      addDebugInfo(`Token format: ${token.substring(0, 20)}...`);
      
      // Analyze token structure
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          addDebugInfo(`Token payload: ${JSON.stringify(payload)}`);
          
          if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            addDebugInfo(`Token expires: ${expDate.toLocaleString()}`);
          }
        } else {
          addDebugInfo(`WARNING: Token does not appear to be a valid JWT (${parts.length} parts)`);
        }
      } catch (err) {
        addDebugInfo(`Error parsing token: ${err}`);
      }
    }
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      redirectToLogin(location.pathname);
    }
  }, [isAuthenticated, redirectToLogin, location.pathname, authToken]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.type === "application/pdf" && selected.size <= 10 * 1024 * 1024) {
      setFile(selected);
      setError(null);
      console.log('File selected:', selected.name, 'Size:', selected.size);
      addDebugInfo(`File selected: ${selected.name} (${(selected.size / 1024).toFixed(2)} KB)`);
    } else {
      setFile(null);
      setError("Please upload a valid PDF file under 10MB.");
      console.log('Invalid file selected');
      addDebugInfo('Invalid file selected - must be PDF under 10MB');
    }
  };

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setDebugInfo(prev => `${prev}\n[${timestamp}] ${info}`);
  };

  const clearDebugInfo = () => {
    setDebugInfo('');
    addDebugInfo('Debug log cleared');
  };

  const handleUpload = async () => {
    if (!file) {
      console.log('No file selected');
      addDebugInfo('Error: No file selected');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      addDebugInfo('Error: Not authenticated, redirecting to login');
      redirectToLogin(location.pathname);
      return;
    }
    
    setUploading(true);
    setError(null);
    addDebugInfo('Starting file upload process');
    console.log('Starting file upload');
    
    const token = getAuthToken();
    addDebugInfo(`Token check before upload: ${!!token ? 'Present' : 'Missing'}`);
    if (token) {
      addDebugInfo(`Token format: ${token.substring(0, 20)}...`);
    }

    try {
      addDebugInfo(`API URL: ${API_URL}/papers/pdf`);
      
      // Create a detailed network request object for debugging
      const requestDetails = {
        url: `${API_URL}/papers/pdf`,
        method: 'POST',
        headers: {
          'Authorization': token ? (token.startsWith('Bearer ') ? `${token.substring(0, 25)}...` : `Bearer ${token.substring(0, 20)}...`) : 'None'
        },
        file: {
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024).toFixed(2)} KB`
        }
      };
      setLastNetworkRequest(requestDetails);
      addDebugInfo(`Request details: ${JSON.stringify(requestDetails, null, 2)}`);
      
      addDebugInfo('Calling uploadPaper API...');
      const result = await uploadPaper(file);
      console.log('Upload successful, parsed data received:', result);
      addDebugInfo('Upload successful!');
      addDebugInfo(`Response: ${JSON.stringify(result, null, 2).substring(0, 200)}...`);
      
      setParsedData(result);
      toast.success("Paper uploaded successfully");
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.message || "Upload failed.";
      addDebugInfo(`Upload error: ${errorMessage}`);
      
      if (errorMessage.includes("Unauthorized") || errorMessage.includes("Authentication required")) {
        console.log('Unauthorized, redirecting to login');
        addDebugInfo('Unauthorized, redirecting to login');
        redirectToLogin(location.pathname);
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
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
      console.log('Paper saved successfully:', savedPaper);

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

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  const forceTokenRefresh = () => {
    localStorage.removeItem('authToken');
    addDebugInfo('Auth token forcibly removed, reloading page...');
    toast.info('Auth token cleared, reloading page');
    setTimeout(() => window.location.reload(), 500);
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
        
        <Button variant="outline" size="icon" onClick={toggleDebug} title="Toggle Debug Info">
          <Bug className="h-4 w-4" />
        </Button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}
      
      {showDebug && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto max-h-60 border border-gray-300 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold">Debug Information:</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearDebugInfo}>
                Clear Log
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={forceTokenRefresh}
                className="text-red-500"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Reset Token
              </Button>
            </div>
          </div>
          <div className="space-y-1 mb-2">
            <p><strong>API URL:</strong> {API_URL}</p>
            <p><strong>Auth Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
            <p><strong>Token Present:</strong> {getAuthToken() ? 'Yes' : 'No'}</p>
            {getAuthToken() && (
              <p>
                <strong>Token Format:</strong> {getAuthToken()?.substring(0, 20)}...
              </p>
            )}
          </div>
          
          {lastNetworkRequest && (
            <>
              <p className="font-bold mt-2">Last Request:</p>
              <pre className="whitespace-pre-wrap bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">
                {JSON.stringify(lastNetworkRequest, null, 2)}
              </pre>
            </>
          )}
          
          <p className="font-bold mt-2">Log:</p>
          <pre className="whitespace-pre-wrap">{debugInfo || 'No log entries yet'}</pre>
        </div>
      )}

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
