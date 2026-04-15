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
import BuyData from "./pages/BuyData";
import PayBills from "./pages/PayBills";
import FundWallet from "./pages/FundWallet";
import PaymentVerify from "./pages/PaymentVerify";
import History from "./pages/History";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Security from "./pages/Security";
import PaymentMethods from "./pages/PaymentMethods";
import NotificationSettings from "./pages/NotificationSettings";
import HelpSupport from "./pages/HelpSupport";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pagesWithNav = ['/dashboard', '/history', '/fund-wallet', '/profile'];
  const showNav = pagesWithNav.some(path => location.pathname.startsWith(path));

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/buy-airtime" element={<BuyAirtime />} />
        <Route path="/buy-data" element={<BuyData />} />
        <Route path="/pay-bills" element={<PayBills />} />
        <Route path="/fund-wallet" element={<FundWallet />} />
        <Route path="/payment/verify" element={<PaymentVerify />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/security" element={<Security />} />
        <Route path="/profile/payments" element={<PaymentMethods />} />
        <Route path="/profile/notifications" element={<NotificationSettings />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {showNav && (
        <BottomNav
          currentPath={location.pathname}
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
