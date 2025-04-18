
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Book, Search, Filter, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define exam type
interface Exam {
  id: string;
  title: string;
  subject: string;
  year: number;
  type: string;
  duration: number;
  available: boolean;
}

const fetchExams = async (): Promise<Exam[]> => {
  const response = await fetch("https://scot-exam-api.fly.dev/api/exams");
  
  if (!response.ok) {
    throw new Error("Failed to fetch exams");
  }
  
  return response.json();
};

const ExamBrowser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const { data: exams = [], isLoading, error } = useQuery({
    queryKey: ["exams"],
    queryFn: fetchExams,
  });

  const subjects = [...new Set(exams.map((exam) => exam.subject))];
  const years = [...new Set(exams.map((exam) => exam.year))].sort((a, b) => b - a);

  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter ? exam.subject === subjectFilter : true;
    const matchesYear = yearFilter ? exam.year === parseInt(yearFilter) : true;
    
    return matchesSearch && matchesSubject && matchesYear;
  });

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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to load exams</h2>
        <p className="text-gray-700 mb-6">
          There was a problem connecting to the server. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Available Exams</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Subject filter */}
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger>
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by subject" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Year filter */}
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by year" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-gray-500 mb-2">
          Showing {filteredExams.length} of {exams.length} exams
        </div>
      </div>

      {filteredExams.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg font-medium text-gray-600 mb-4">No exams match your filters</p>
          <Button onClick={() => {
            setSearchTerm("");
            setSubjectFilter("");
            setYearFilter("");
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className={`transition-all hover:shadow-lg ${!exam.available ? 'opacity-60' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-start">
                  <Book className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                  <span>{exam.title}</span>
                </CardTitle>
                <CardDescription>{exam.subject} - {exam.year}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <span>Type: {exam.type}</span>
                  <span>Duration: {exam.duration} mins</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleExamSelect(exam.id)} 
                  className="w-full"
                  disabled={!exam.available}
                >
                  {exam.available ? "Start Exam" : "Coming Soon"}
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
