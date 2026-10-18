import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import Index from "./pages/Index";
import About from "./pages/About";
import Alumni from "./pages/Alumni";
import SearchAlumni from "./pages/SearchAlumni";
import Contact from "./pages/Contact";
import Notices from "./pages/Notices";
import Gallery from "./pages/Gallery";
import Events from "./pages/Events";
import Donations from "./pages/Donations";
import AlumniDirectory from "./pages/AlumniDirectory";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardRouter from "./pages/DashboardRouter";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Memories from "./pages/Memories";
import MemoryDetail from "./pages/MemoryDetail";
import ScrollToTop from "./components/ScrollToTop";
import { ConfirmProvider } from "./components/common/ConfirmDialog";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { LanguageProvider } from "./lib/i18n";

const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" role="status" aria-label="লোড হচ্ছে" />
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
  <LanguageProvider>
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ConfirmProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/alumni" element={<Alumni />} />
              <Route path="/search" element={<SearchAlumni />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/events" element={<Events />} />
              <Route path="/donations" element={<Donations />} />
              <Route path="/directory" element={<AlumniDirectory />} />
              <Route path="/memories" element={<Memories />} />
              <Route path="/memories/:id" element={<MemoryDetail />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/super-admin" element={<Navigate to="/admin/dashboard?tab=admins" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </ConfirmProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
  </LanguageProvider>
  </ThemeProvider>
);

export default App;
