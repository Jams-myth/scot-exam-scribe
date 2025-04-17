
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Upload, FileUp, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Define the form schema with zod
const formSchema = z.object({
  subject: z.string().min(2, { message: "Subject must be at least 2 characters" }),
  year: z.string()
    .refine((val) => !isNaN(parseInt(val)), { message: "Year must be a number" })
    .refine((val) => parseInt(val) > 1990 && parseInt(val) <= new Date().getFullYear(), 
      { message: `Year must be between 1991 and ${new Date().getFullYear()}` }),
  file: z.instanceof(File).refine((file) => file.size <= 10000000, {
    message: "File size must be less than 10MB",
  }).refine((file) => ["application/pdf"].includes(file.type), {
    message: "Only PDF files are accepted",
  })
});

type FormValues = z.infer<typeof formSchema>;

const UploadPaper = () => {
  const [isUploading, setIsUploading] = useState(false);
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      year: new Date().getFullYear().toString(),
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsUploading(true);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("subject", values.subject);
      formData.append("year", values.year);
      formData.append("file", values.file);
      
      // Use a more specific backend API endpoint
      const response = await fetch("https://scot-exam-api.fly.dev/api/papers", {
        method: "POST",
        body: formData,
        // No need to set Content-Type header as FormData sets it automatically
        // CORS is handled by the backend
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload paper: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      toast.success("Paper uploaded successfully", {
        description: `${values.subject} (${values.year}) has been uploaded.`
      });
      
      // Reset form
      form.reset();
    } catch (error) {
      console.error("Error uploading paper:", error);
      toast.error("Failed to upload paper", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container py-10 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload New Exam Paper</CardTitle>
          <CardDescription>
            Upload a Scottish National 5 exam paper in PDF format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mathematics, English, Biology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" min={1991} max={new Date().getFullYear()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Exam Paper
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPaper;
