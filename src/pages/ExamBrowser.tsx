
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Book, Search, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchPapers } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ExamBrowser = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: exams = [], isLoading, error } = useQuery({
    queryKey: ["exams"],
    queryFn: fetchPapers,
    retry: 2,
    onSettled: (data, error) => {
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load exams"
        });
      }
    },
  });

  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExamSelect = (examId: string) => {
    navigate(`/exam/${examId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader className="h-8 w-8 animate-spin" />
        <div className="text-xl">Loading exams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load exams. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Available Exams</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search exams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredExams.length === 0 ? (
        <Alert>
          <AlertDescription>
            {searchTerm ? "No exams match your search." : "No exams found."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start">
                  <Book className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                  <span>{exam.title}</span>
                </CardTitle>
                <CardDescription>{exam.subject} - {exam.year}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  Duration: {exam.duration} minutes
                </div>
                <div className="text-sm text-gray-600">
                  Questions: {exam.questions.length}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleExamSelect(exam.id)} 
                  className="w-full"
                >
                  Start Exam
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamBrowser;
