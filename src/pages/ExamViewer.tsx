import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { 
  Alert,
  AlertDescription 
} from "@/components/ui/alert";

interface Exam {
  id: string;
  title: string;
  subject: string;
  year: number;
  type: string;
  duration: number;
  questions: Question[];
}

interface Question {
  id: string;
  number: number;
  text: string;
  type: "multiple-choice" | "short-answer" | "extended-response";
  points: number;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  feedbackShown?: boolean;
}

const fetchExamById = async (id: string): Promise<Exam> => {
  const response = await fetch(`https://scot-exam-api.fly.dev/api/exams/${id}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch exam");
  }
  
  return response.json();
};

const ExamViewer = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const { data: exam, isLoading, error } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => fetchExamById(examId || ""),
    enabled: !!examId,
  });

  useEffect(() => {
    if (exam && !timeRemaining) {
      setTimeRemaining(exam.duration * 60);
    }
  }, [exam, timeRemaining]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || examSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          toast({
            variant: "destructive",
            title: "Time's up!",
            description: "Your exam has been automatically submitted."
          });
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, examSubmitted]);

  useEffect(() => {
    if (exam && userAnswers.length === 0) {
      const initialAnswers: UserAnswer[] = exam.questions.map((question) => ({
        questionId: question.id,
        answer: "",
      }));
      setUserAnswers(initialAnswers);
    }
  }, [exam, userAnswers.length]);

  const currentQuestion = exam?.questions?.[currentQuestionIndex];

  const handleAnswerChange = (answer: string) => {
    if (!currentQuestion) return;
    
    setUserAnswers(prev => 
      prev.map(ua => 
        ua.questionId === currentQuestion.id 
          ? { ...ua, answer, feedbackShown: false } 
          : ua
      )
    );
  };

  const handleNextQuestion = () => {
    if (!exam) return;
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleCheckAnswer = () => {
    if (!currentQuestion) return;
    
    const userAnswer = userAnswers.find(ua => ua.questionId === currentQuestion.id);
    if (!userAnswer || !userAnswer.answer) {
      toast({
        variant: "default",
        title: "No answer provided",
        description: "Please provide an answer before checking."
      });
      return;
    }

    const isCorrect = userAnswer.answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    
    setUserAnswers(prev => 
      prev.map(ua => 
        ua.questionId === currentQuestion.id 
          ? { ...ua, isCorrect, feedbackShown: true } 
          : ua
      )
    );

    setShowFeedback(true);
  };

  const handleSubmitExam = () => {
    if (!exam) return;
    
    const answeredQuestions = userAnswers.filter(ua => ua.answer !== "");
    const correctAnswers = userAnswers.filter(ua => {
      const question = exam.questions.find(q => q.id === ua.questionId);
      return question && ua.answer.toLowerCase() === question.correctAnswer.toLowerCase();
    });

    const score = correctAnswers.length;
    const totalQuestions = exam.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    const markedAnswers = userAnswers.map(ua => {
      const question = exam.questions.find(q => q.id === ua.questionId);
      const isCorrect = question && ua.answer.toLowerCase() === question.correctAnswer.toLowerCase();
      return { ...ua, isCorrect, feedbackShown: true };
    });
    
    setUserAnswers(markedAnswers);
    setExamSubmitted(true);
    setShowFeedback(true);
    
    toast({
      title: "Exam submitted successfully",
      description: `Your score: ${score}/${totalQuestions} (${percentage}%)`,
    });
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading exam...</div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to load exam</h2>
        <p className="text-gray-700 mb-6">
          There was a problem loading the exam. Please try again later.
        </p>
        <Button onClick={() => navigate("/exams")}>Back to Exams</Button>
      </div>
    );
  }

  const userAnswer = currentQuestion 
    ? userAnswers.find(ua => ua.questionId === currentQuestion.id)
    : undefined;

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-gray-600">{exam.subject} - {exam.year}</p>
        </div>
        
        <div className="flex items-center mt-4 md:mt-0">
          <Clock className="h-5 w-5 mr-2 text-orange-500" />
          <span className={`font-mono ${timeRemaining && timeRemaining < 300 ? 'text-red-600 font-bold' : ''}`}>
            {timeRemaining !== null ? formatTime(timeRemaining) : 'Loading...'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Question {currentQuestion.number} 
            <span className="text-gray-500 text-sm ml-2">({currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'})</span>
          </h2>
          <div className="text-sm text-gray-600">
            {currentQuestionIndex + 1} of {exam.questions.length}
          </div>
        </div>
        
        <div className="prose max-w-none mb-6">
          <div dangerouslySetInnerHTML={{ __html: currentQuestion.text }} />
        </div>
        
        {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
          <div className="space-y-2 mb-6">
            <RadioGroup
              value={userAnswer?.answer || ""}
              onValueChange={handleAnswerChange}
              disabled={examSubmitted}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <label
                    htmlFor={`option-${index}`}
                    className="text-base cursor-pointer flex-1"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
        
        {currentQuestion.type === "short-answer" && (
          <div className="mb-6">
            <Input
              placeholder="Your answer..."
              value={userAnswer?.answer || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              disabled={examSubmitted}
              className="w-full"
            />
          </div>
        )}
        
        {currentQuestion.type === "extended-response" && (
          <div className="mb-6">
            <textarea
              placeholder="Your answer..."
              value={userAnswer?.answer || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              disabled={examSubmitted}
              className="w-full p-3 border border-gray-300 rounded-md min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        
        {showFeedback && userAnswer?.feedbackShown && (
          <Alert className={`mb-6 ${userAnswer.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
            {userAnswer.isCorrect ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <AlertDescription className="mt-2">
              {userAnswer.isCorrect 
                ? "Correct! Well done." 
                : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`}
              
              {currentQuestion.explanation && (
                <div className="mt-2 text-sm">
                  <strong>Explanation:</strong> {currentQuestion.explanation}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          
          <div className="flex space-x-2">
            {!examSubmitted && (
              <Button
                variant="secondary"
                onClick={handleCheckAnswer}
                disabled={!userAnswer?.answer}
              >
                Check Answer
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === exam.questions.length - 1}
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {!examSubmitted && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmitExam}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" /> Submit Exam
          </Button>
        </div>
      )}

      {examSubmitted && (
        <Card>
          <CardHeader>
            <CardTitle>Exam Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                You've completed the exam. Here's a summary of your performance:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">
                    {userAnswers.filter(ua => ua.answer !== "").length}
                  </div>
                  <div className="text-sm text-gray-500">Questions Answered</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {userAnswers.filter(ua => ua.isCorrect).length}
                  </div>
                  <div className="text-sm text-gray-500">Correct Answers</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">
                    {Math.round((userAnswers.filter(ua => ua.isCorrect).length / exam.questions.length) * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">Overall Score</div>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate("/exams")} 
                className="w-full mt-4"
              >
                Return to Exam Browser
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExamViewer;
