
import { useQuery } from "@tanstack/react-query";
import { Book } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAllQuestions } from "@/services/api";

const Questions = () => {
  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['questions'],
    queryFn: fetchAllQuestions,
  });

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
      <h1 className="text-2xl font-bold mb-6">Exam Questions</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Subject</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question) => (
            <TableRow key={question.id}>
              <TableCell className="font-medium">{question.text}</TableCell>
              <TableCell>{question.type}</TableCell>
              <TableCell>{question.points}</TableCell>
              <TableCell>{question.subject}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Questions;
