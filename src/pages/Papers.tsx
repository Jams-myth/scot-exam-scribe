
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Book, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { fetchPapers } from "@/services/papers";
import { useAuth } from "@/lib/hooks/useAuth";
import { Paper } from "@/types/exam";
import { Button } from "@/components/ui/button";

const formatDate = (dateStr: string | number | undefined) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
};

const Papers = () => {
  const { redirectToLogin } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: papers, isLoading, error } = useQuery({
    queryKey: ['papers'],
    queryFn: fetchPapers,
    meta: {
      onError: () => {
        redirectToLogin();
      },
    },
  });

  // Filter papers based on search term
  const filteredPapers = papers?.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.grade_level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (paperId: string) => {
    navigate(`/questions?paperId=${paperId}`);
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
        <Book className="h-12 w-12 text-gray-400" />
        <p className="text-gray-600">Failed to load papers. Please try again later.</p>
      </div>
    );
  }

  if (!papers?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <Book className="h-12 w-12 text-gray-400" />
        <p className="text-gray-600">No papers available.</p>
        <Link to="/upload">
          <Button>Upload New Paper</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exam Papers ({papers.length} total)</h1>
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search papers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Link to="/upload">
            <Button>Upload New Paper</Button>
          </Link>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Grade Level</TableHead>
            <TableHead>Total Marks</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(filteredPapers || []).map((paper) => (
            <TableRow 
              key={paper.id} 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleRowClick(paper.id)}
            >
              <TableCell className="font-medium">{paper.title || 'N/A'}</TableCell>
              <TableCell>{paper.subject || 'N/A'}</TableCell>
              <TableCell>{paper.grade_level || 'N/A'}</TableCell>
              <TableCell>{paper.total_marks || 'N/A'}</TableCell>
              <TableCell>{formatDate(paper.created_at || paper.year)}</TableCell>
              <TableCell>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link to={`/questions?paperId=${paper.id}`}>
                    <Button variant="outline" size="sm">View Questions</Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Papers;
