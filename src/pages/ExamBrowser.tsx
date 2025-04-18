
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Book, Search } from "lucide-react";
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

const ExamBrowser = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: fetchPapers,
  });

  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExamSelect = (examId: string) => {
    navigate(`/exam/${examId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading exams...</div>
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
    </div>
  );
};

export default ExamBrowser;
