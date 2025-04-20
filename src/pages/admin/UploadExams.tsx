
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { useAuth } from '@/lib/hooks/useAuth';
import { uploadExamPaper } from '@/services/uploadExamService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUp } from 'lucide-react';

// Grade levels for dropdown
const gradeLevels = [
  "Form 1", "Form 2", "Form 3", "Form 4", 
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6", 
  "Standard 7", "Standard 8"
];

const UploadExams = () => {
  const { isAdmin, isCheckingAdmin } = useAdmin();
  const { isAuthenticated, redirectToLogin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    gradeLevel: '',
    category: '',
    year: new Date().getFullYear(),
    examName: '',
    totalMarks: 100,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle redirect for non-admin users
  React.useEffect(() => {
    if (!isCheckingAdmin && !isAdmin) {
      toast.error("Access denied: Admin permissions required");
      navigate('/');
    }
    
    if (!isAuthenticated) {
      redirectToLogin();
    }
  }, [isAdmin, isCheckingAdmin, isAuthenticated, navigate, redirectToLogin]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a PDF file to upload');
      return;
    }

    // Validate form
    const requiredFields = ['title', 'subject', 'gradeLevel', 'year', 'examName'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsUploading(true);

    try {
      // Create paper object with all metadata
      const paperData = {
        title: formData.title,
        subject: formData.subject,
        grade_level: formData.gradeLevel,
        type: formData.category,
        year: parseInt(formData.year.toString()),
        total_marks: parseInt(formData.totalMarks.toString()),
        description: formData.examName,
        time_limit_minutes: 0, // Default value
        duration: 0, // Default value
      };

      // Upload file and save paper data
      await uploadExamPaper(selectedFile, paperData);

      toast.success('Exam uploaded successfully!');
      setFormData({
        title: '',
        subject: '',
        gradeLevel: '',
        category: '',
        year: new Date().getFullYear(),
        examName: '',
        totalMarks: 100,
      });
      setSelectedFile(null);
      
      // Reset the file input by accessing and resetting the form
      const form = document.getElementById('upload-form') as HTMLFormElement;
      if (form) form.reset();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload exam paper');
    } finally {
      setIsUploading(false);
    }
  };

  // Show loading state while checking admin status
  if (isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // If not admin, don't render the form at all (we already redirect in useEffect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-6 w-6" />
            Upload Exam Paper (Admin Only)
          </CardTitle>
          <CardDescription>
            Upload a new exam paper and its metadata to the system.
            Only administrators can access this feature.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
            <AlertDescription>
              Files will be uploaded to Supabase storage and their URLs stored in the papers table.
            </AlertDescription>
          </Alert>
          
          <form id="upload-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Final Examination" 
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input 
                  id="subject" 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Mathematics" 
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Grade Level *</Label>
                <Select 
                  value={formData.gradeLevel} 
                  onValueChange={(value) => handleSelectChange(value, 'gradeLevel')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Mid-term, Final" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input 
                  id="year" 
                  name="year" 
                  type="number" 
                  value={formData.year} 
                  onChange={handleInputChange} 
                  min="2000" 
                  max="2100"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="examName">Exam Name *</Label>
                <Input 
                  id="examName" 
                  name="examName" 
                  value={formData.examName} 
                  onChange={handleInputChange} 
                  placeholder="e.g., End of Term Examination"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input 
                  id="totalMarks" 
                  name="totalMarks" 
                  type="number" 
                  value={formData.totalMarks} 
                  onChange={handleInputChange} 
                  min="0" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdfFile">Upload PDF *</Label>
                <Input 
                  id="pdfFile" 
                  name="pdfFile" 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange}
                  required
                />
                {selectedFile && (
                  <p className="text-sm text-green-600">Selected file: {selectedFile.name}</p>
                )}
              </div>
            </div>

            <CardFooter className="flex justify-end px-0">
              <Button 
                type="submit" 
                disabled={isUploading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isUploading ? (
                  <>
                    <div className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Uploading...
                  </>
                ) : (
                  'Upload Exam Paper'
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadExams;
