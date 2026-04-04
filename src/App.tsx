import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BuyAirtime from "./pages/BuyAirtime";
import FundWallet from "./pages/FundWallet";
import PaymentVerify from "./pages/PaymentVerify";
import History from "./pages/History";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const pagesWithNav = ['/dashboard', '/history', '/wallet', '/profile'];
  const showNav = pagesWithNav.some(path => location.pathname.startsWith(path));

  const navPathMap: Record<string, string> = {
    '/': '/dashboard',
    '/history': '/history',
    '/wallet': '/wallet',
    '/profile': '/profile',
  };

  const currentNavPath = Object.keys(navPathMap).find(
    key => location.pathname.startsWith(navPathMap[key])
  ) || '/';

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/buy-airtime" element={<BuyAirtime />} />
        <Route path="/fund-wallet" element={<FundWallet />} />
        <Route path="/payment/verify" element={<PaymentVerify />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {showNav && (
        <BottomNav
          currentPath={navPathMap[currentNavPath] || '/dashboard'}
          onNavigate={(path) => navigate(path)}
        />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
