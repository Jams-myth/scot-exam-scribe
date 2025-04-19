
import { useQuery } from "@tanstack/react-query";
import { Book, Search } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { fetchAllQuestions } from "@/services/questions";
import { useAuth } from "@/lib/hooks/useAuth";
import { ParsedQuestion } from "@/types/exam";

const Questions = () => {
  const { redirectToLogin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const paperId = searchParams.get("paperId");
  
  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['questions', paperId],
    queryFn: () => fetchAllQuestions(paperId || undefined),
    meta: {
      onError: () => {
        redirectToLogin();
      },
    },
  });

  // Filter questions based on search term
  const filteredQuestions = questions?.filter(q => 
    q.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.question_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.difficulty_level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <Book className="h-12 w-12 text-gray-400" />
        <p className="text-gray-600">Failed to load questions. Please try again later.</p>
      </div>
    );
  }

  if (!questions?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <Book className="h-12 w-12 text-gray-400" />
        <p className="text-gray-600">No questions available.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {paperId ? 'Paper Questions' : 'All Questions'} ({questions.length} total)
        </h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Section</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(filteredQuestions || []).map((question) => (
            <TableRow key={question.id}>
              <TableCell className="font-medium max-w-xl truncate">
                {question.question_text || question.text || 'N/A'}
              </TableCell>
              <TableCell>{question.question_type || question.type || 'N/A'}</TableCell>
              <TableCell>{question.marks || question.points || 'N/A'}</TableCell>
              <TableCell>{question.difficulty_level || 'N/A'}</TableCell>
              <TableCell>{question.section || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Questions;
