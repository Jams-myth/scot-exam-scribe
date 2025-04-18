
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Upload, FileUp, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define form schema with validation rules
const formSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size <= 10000000, {
    message: "File size must be less than 10MB",
  }).refine((file) => ["application/pdf"].includes(file.type), {
    message: "Only PDF files are accepted",
  })
});

type FormValues = z.infer<typeof formSchema>;

interface ParsedQuestion {
  id: string;
  text: string;
  options?: string[];
  correctAnswer: string;
}

interface UploadResponse {
  success: boolean;
  questions: ParsedQuestion[];
  error?: string;
}

const UploadPaper = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[] | null>(null);
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormValues) => {
    setIsUploading(true);
    setParsedQuestions(null);
    
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append("file", values.file);
      
      const response = await fetch("https://exam-vault-api.onrender.com/api/v1/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText || response.statusText}`);
      }
      
      const result: UploadResponse = await response.json();
      
      if (!result.success || !result.questions) {
        throw new Error(result.error || "Failed to parse exam questions");
      }
      
      setParsedQuestions(result.questions);
      
      toast.success("PDF uploaded and parsed successfully", {
        description: `${result.questions.length} questions extracted`
      });
      
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast.error("Failed to upload PDF", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
      setParsedQuestions(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload Exam Paper</CardTitle>
          <CardDescription>
            Upload a PDF exam paper to extract questions automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="file"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Exam Paper (PDF)</FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileUp className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF only (max 10MB)</p>
                          </div>
                          <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept="application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                              }
                            }}
                            {...fieldProps}
                          />
                        </label>
                      </div>
                    </FormControl>
                    {value && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected file: {value instanceof File ? value.name : ""}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing PDF...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload and Parse Questions
                  </>
                )}
              </Button>
            </form>
          </Form>

          {parsedQuestions && parsedQuestions.length > 0 && (
            <div className="mt-8 space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Questions Extracted Successfully</AlertTitle>
                <AlertDescription>
                  {parsedQuestions.length} questions were parsed from the PDF. Review them below.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                {parsedQuestions.map((question, index) => (
                  <Card key={question.id}>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2">Question {index + 1}</h3>
                      <p className="text-sm mb-4">{question.text}</p>
                      
                      {question.options && (
                        <div className="ml-4 space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <span className="text-sm font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                              <span className="text-sm">{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Correct Answer:</span> {question.correctAnswer}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPaper;
