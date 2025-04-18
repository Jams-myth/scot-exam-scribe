
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UploadPaper from "./pages/UploadPaper";
import ExamBrowser from "./pages/ExamBrowser";
import ExamViewer from "./pages/ExamViewer";
import MainNav from "./components/MainNav";
import Login from "./pages/Login";
import MinimalUploadTest from "./pages/MinimalUploadTest";
import { useAuth } from "@/lib/hooks/useAuth";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading, redirectToLogin } = useAuth();
  const location = useLocation();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    redirectToLogin(location.pathname);
    return null;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <>
      <MainNav />
      <main className="min-h-[calc(100vh-64px)]">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPaper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-test"
            element={
              <ProtectedRoute>
                <MinimalUploadTest />
              </ProtectedRoute>
            }
          />
          <Route path="/exams" element={<ExamBrowser />} />
          <Route path="/exam/:examId" element={<ExamViewer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
