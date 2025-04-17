
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-3xl px-4">
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
        </div>
      </div>
    </div>
  );
};

export default Index;
