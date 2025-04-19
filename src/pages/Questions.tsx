
import { useQuery } from "@tanstack/react-query";
import { Book, Search, Copy, CheckCircle } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { fetchAllQuestions } from "@/services/questions";
import { useAuth } from "@/lib/hooks/useAuth";
import { ParsedQuestion } from "@/types/exam";
import { toast } from "sonner";

const Questions = () => {
  const { redirectToLogin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const paperId = searchParams.get("paperId");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['questions', paperId],
    queryFn: () => fetchAllQuestions(paperId || undefined),
    meta: {
      onError: (error: any) => {
        console.error("Questions fetch error:", error);
        if (error.message && error.message.includes("Authentication")) {
          redirectToLogin();
        }
      },
    },
  });

  // Filter questions based on search term
  const filteredQuestions = questions?.filter(q => 
    q.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.question_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.difficulty_level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string | undefined, id: string) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedId(id);
        toast.success("Question copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(err => {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy text");
      });
  };

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
        <Book className="h-12 w-12 text-red-400" />
        <p className="text-red-600">Failed to load questions. Please try again later.</p>
        <p className="text-gray-500 text-sm">{(error as Error).message}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!questions?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <Book className="h-12 w-12 text-gray-400" />
        <p className="text-gray-600">No questions available yet.</p>
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
            <TableHead className="w-10">Copy</TableHead>
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
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => copyToClipboard(question.question_text || question.text, question.id)}
                  title="Copy question text"
                >
                  {copiedId === question.id ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Questions;
