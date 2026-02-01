import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { WalletProviders } from "@/components/WalletProviders";
import { ROUTE_PATHS } from "@/lib/index";

import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import History from "@/pages/History";
import Settings from "@/pages/Settings";

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
              <Route 
                path={ROUTE_PATHS.HOME} 
                element={<Home />} 
              />
              <Route 
                path={ROUTE_PATHS.DASHBOARD} 
                element={<Dashboard />} 
              />
              <Route 
                path={ROUTE_PATHS.EMPLOYEES} 
                element={<Employees />} 
              />
              <Route 
                path={ROUTE_PATHS.HISTORY} 
                element={<History />} 
              />
              <Route 
                path={ROUTE_PATHS.SETTINGS} 
                element={<Settings />} 
              />
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