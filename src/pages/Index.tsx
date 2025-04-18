
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-3xl px-4 mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Scottish National 5 Exam Study Platform</h1>
        <p className="text-xl text-gray-700 mb-8">
          Upload, manage, and analyze Scottish National 5 exam papers and marking schemes to help students study effectively.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/upload">
              <Upload className="mr-2 h-5 w-5" />
              Upload Exam Paper
            </Link>
          </Button>
          
          <Button asChild size="lg" variant="secondary">
            <Link to="/exams">
              <BookOpen className="mr-2 h-5 w-5" />
              Browse Exams
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Exam Selection</CardTitle>
              <CardDescription>Browse and select from a variety of available Scottish National 5 exams</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Access a comprehensive collection of exams organized by subject, year, and type. Use filters to quickly find the specific exam you're looking for.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/exams">Browse Exams</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interactive Exam Practice</CardTitle>
              <CardDescription>Take exams in an environment similar to the real thing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Practice with exams that simulate the real testing experience. Answer different question types including multiple choice, short answer, and extended response.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/exams">Start Practicing</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instant Feedback</CardTitle>
              <CardDescription>Get immediate feedback on your answers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Receive instant feedback on your answers, with detailed explanations for correct solutions based on the actual marking scheme.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/exams">Try It Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
