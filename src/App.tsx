import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { WalletProviders } from "@/components/WalletProviders";
import { ROUTE_PATHS } from "@/lib/index";
import { AuthGuard } from "@/components/AuthGuard";

import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import EmployeePortal from "@/pages/EmployeePortal";
import EmployeeHistory from "@/pages/EmployeeHistory";
import EmployeeConfig from "@/pages/EmployeeConfig";
import DevMode from "@/pages/DevMode";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <WalletProviders>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* PUBLIC ROUTES */}
              <Route
                path={ROUTE_PATHS.HOME}
                element={<Home />}
              />

              {/* ADMIN ROUTES */}
              <Route
                path={ROUTE_PATHS.DASHBOARD}
                element={
                  <AuthGuard allowedRoles={['admin']}>
                    <Dashboard />
                  </AuthGuard>
                }
              />
              <Route
                path={ROUTE_PATHS.EMPLOYEES}
                element={
                  <AuthGuard allowedRoles={['admin']}>
                    <Employees />
                  </AuthGuard>
                }
              />
              <Route
                path={ROUTE_PATHS.HISTORY}
                element={
                  <AuthGuard allowedRoles={['admin']}>
                    <History />
                  </AuthGuard>
                }
              />
              <Route
                path={ROUTE_PATHS.SETTINGS}
                element={
                  <AuthGuard allowedRoles={['admin']}>
                    <Settings />
                  </AuthGuard>
                }
              />

              {/* EMPLOYEE ROUTES */}
              <Route
                path={ROUTE_PATHS.PORTAL}
                element={
                  <AuthGuard allowedRoles={['employee']}>
                    <EmployeePortal />
                  </AuthGuard>
                }
              />
              <Route
                path={ROUTE_PATHS.PORTAL_HISTORY}
                element={
                  <AuthGuard allowedRoles={['employee']}>
                    <EmployeeHistory />
                  </AuthGuard>
                }
              />
              <Route
                path={ROUTE_PATHS.PORTAL_CONFIG}
                element={
                  <AuthGuard allowedRoles={['employee']}>
                    <EmployeeConfig />
                  </AuthGuard>
                }
              />

              {/* Dev Mode Route */}
              <Route
                path="/dev"
                element={<DevMode />}
              />

              {/* Catch-all route */}
              <Route
                path="*"
                element={<Home />}
              />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner position="top-right" expand={false} richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </WalletProviders>
  );
};

export default App;