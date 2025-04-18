
import React, { useState, useEffect } from "react";
import { uploadPaper, savePaper, saveQuestions } from "@/services/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { FilePlus } from "lucide-react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const UploadPaper = () => {
  const { isAuthenticated, redirectToLogin } = useAuth();
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      redirectToLogin(location.pathname);
    }
  }, [isAuthenticated, redirectToLogin, location.pathname]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.type === "application/pdf" && selected.size <= 10 * 1024 * 1024) {
      setFile(selected);
      setError(null);
    } else {
      setFile(null);
      setError("Please upload a valid PDF file under 10MB.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    if (!isAuthenticated) {
      redirectToLogin(location.pathname);
      return;
    }
    
    setUploading(true);
    setError(null);

    try {
      // Create FormData and append file
      const formData = new FormData();
      formData.append("file", file);

      // Get auth token for API request
      const token = localStorage.getItem('authToken');
      
      // Manual fetch with proper headers instead of using the service function
      const response = await fetch("https://exam-vault-api.onrender.com/api/v1/papers/pdf", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please login to upload papers");
        } 
        throw new Error(`Upload failed (${response.status})`);
      }

      const data = await response.json();
      setParsedData(data);
      toast.success("Paper uploaded successfully");
    } catch (err: any) {
      if (err.message === "Unauthorized: Please login to upload papers") {
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
    if (!parsedData) return;
    
    if (!isAuthenticated) {
      redirectToLogin(location.pathname);
      return;
    }

    try {
      const savedPaper = await savePaper({
        title: parsedData.title,
        subject: parsedData.subject,
        year: parsedData.year || new Date().getFullYear(),
        type: parsedData.type || "Exam",
        duration: parsedData.time_limit_minutes || 60,
        total_marks: parsedData.total_marks,
        description: parsedData.description,
        time_limit_minutes: parsedData.time_limit_minutes,
        grade_level: parsedData.grade_level
      });

      // Access id from data property of the response
      const paperId = savedPaper.data.id;
      
      // Map questions to match the expected format
      const questionPromises = parsedData.questions.map((q: any) =>
        saveQuestions(paperId, [{
          text: q.question_text || "",
          type: q.question_type || "Essay",
          points: q.marks || 0,
          correctAnswer: "",
          section: q.section || "",
          difficulty_level: q.difficulty_level,
          marking_scheme: q.marking_scheme,
          diagrams: q.diagrams
        }])
      );

      await Promise.all(questionPromises);

      setParsedData(null);
      toast.success("Paper and questions saved successfully");
    } catch (err: any) {
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
                  <FilePlus className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </span>
            </TooltipTrigger>
            {!isAuthenticated && <TooltipContent>Login required</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {parsedData && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Parsed Questions</h2>
          {parsedData.questions.map((q: any, idx: number) => (
            <Card key={idx} className="p-3 border">
              <p className="font-semibold">Q{idx + 1}: {q.question_text}</p>
              <p>Marks: {q.marks}</p>
              <p>Type: {q.question_type}</p>
              <p>Difficulty: {q.difficulty_level}</p>
              <p>Section: {q.section || "N/A"}</p>
            </Card>
          ))}
          <Button onClick={handleApproveAndSave}>
            Approve & Save
          </Button>
        </div>
      )}
    </Card>
  );
};

export default UploadPaper;
