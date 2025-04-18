import React, { useState } from "react";
import { uploadPaper, savePaper, saveQuestions } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { FilePlus } from "lucide-react";

const UploadPaper = () => {
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);

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
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const data = await uploadPaper(formData);
      setParsedData(data);
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleApproveAndSave = async () => {
    if (!parsedData) return;

    try {
      const savedPaper = await savePaper({
        title: parsedData.title,
        subject: parsedData.subject,
        grade_level: parsedData.grade_level,
        total_marks: parsedData.total_marks,
        description: parsedData.description,
        time_limit_minutes: parsedData.time_limit_minutes,
      });

      await Promise.all(
        parsedData.questions.map((q: any) =>
          saveQuestions(savedPaper.id, {
            question_text: q.question_text,
            question_type: q.question_type,
            marks: q.marks,
            difficulty_level: q.difficulty_level,
            section: q.section,
            marking_scheme: q.marking_scheme,
            diagrams: q.diagrams,
          })
        )
      );

      setParsedData(null);
      alert("Paper and questions saved successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to save paper.");
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="p-4 max-w-xl mx-auto mt-8">
        <Alert variant="warning">
          You must be logged in to upload an exam paper.
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-4 max-w-xl mx-auto mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <Input type="file" accept=".pdf" onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={!file || uploading}>
          <FilePlus className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
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
