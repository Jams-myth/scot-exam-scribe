
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
import Questions from "./pages/Questions";
import Papers from "./pages/Papers";
import MinimalUploadTest from "./pages/MinimalUploadTest";
import { useAuth } from "@/lib/hooks/useAuth";
import { Suspense, lazy } from "react";
import { useAdmin } from "./lib/hooks/useAdmin";

// Import the admin upload exams page
const UploadExams = lazy(() => import("./pages/admin/UploadExams"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Loading component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
  </div>
);

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading, redirectToLogin } = useAuth();
  const location = useLocation();
  
  // Show loading state
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    redirectToLogin(location.pathname);
    return null;
  }
  
  return children;
};

// Admin protected route component
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { isAdmin, isCheckingAdmin } = useAdmin();
  const { isAuthenticated, isLoading, redirectToLogin } = useAuth();
  const navigate = useLocation();
  
  // Show loading state for both auth and admin checks
  if (isLoading || isCheckingAdmin) {
    return <LoadingScreen />;
  }
  
  // Check authentication first
  if (!isAuthenticated) {
    redirectToLogin(navigate.pathname);
    return null;
  }
  
  // Then check admin status
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show initial loading screen while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <>
      <MainNav />
      <main className="min-h-[calc(100vh-64px)]">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/questions"
              element={
                <ProtectedRoute>
                  <Questions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/papers"
              element={
                <ProtectedRoute>
                  <Papers />
                </ProtectedRoute>
              }
            />
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
            {/* Admin routes */}
            <Route
              path="/admin/upload-exams"
              element={
                <AdminRoute>
                  <UploadExams />
                </AdminRoute>
              }
            />
            <Route path="/exams" element={<ExamBrowser />} />
            <Route path="/exam/:examId" element={<ExamViewer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
};

// Main App component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" closeButton />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
