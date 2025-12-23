import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardEntrepreneur from "./pages/DashboardEntrepreneur";
import DashboardAgent from "./pages/DashboardAgent";
import DashboardCooperative from "./pages/DashboardCooperative";
import DashboardInstitution from "./pages/DashboardInstitution";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardSuperAdmin from "./pages/DashboardSuperAdmin";
import UsersEntrepreneurs from "./pages/UsersEntrepreneurs";
import OrganizationsCooperatives from "./pages/OrganizationsCooperatives";
import OrganizationsInstitutions from "./pages/OrganizationsInstitutions";
import Subscription from "./pages/Subscription";
import FinancingApplication from "./pages/FinancingApplication";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Composant pour rediriger vers le bon dashboard selon le rôle
const DashboardRouter = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  switch (role) {
    case 'entrepreneur':
      return <DashboardEntrepreneur />;
    case 'agent':
      return <DashboardAgent />;
    case 'cooperative':
      return <DashboardCooperative />;
    case 'institution':
      return <DashboardInstitution />;
    case 'admin':
      return <DashboardAdmin />;
    case 'superAdmin':
      return <DashboardSuperAdmin />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscription"
              element={
                <ProtectedRoute>
                  <Subscription />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financing/apply"
              element={
                <ProtectedRoute allowedRoles={['entrepreneur']}>
                  <FinancingApplication />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/entrepreneurs"
              element={
                <ProtectedRoute allowedRoles={['superAdmin', 'admin']}>
                  <UsersEntrepreneurs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizations/cooperatives"
              element={
                <ProtectedRoute allowedRoles={['superAdmin', 'admin']}>
                  <OrganizationsCooperatives />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizations/institutions"
              element={
                <ProtectedRoute allowedRoles={['superAdmin', 'admin']}>
                  <OrganizationsInstitutions />
                </ProtectedRoute>
              }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
