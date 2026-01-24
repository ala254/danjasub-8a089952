import React from 'react';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Phone,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  path?: string;
  onClick?: () => void;
  danger?: boolean;
}

const menuItems: MenuItem[] = [
  { icon: User, label: 'Personal Information', description: 'Update your profile details', path: '/profile/edit' },
  { icon: Shield, label: 'Security', description: 'PIN, password & biometrics', path: '/profile/security' },
  { icon: CreditCard, label: 'Payment Methods', description: 'Manage cards & bank accounts', path: '/profile/payments' },
  { icon: Bell, label: 'Notifications', description: 'Customize your alerts', path: '/profile/notifications' },
  { icon: HelpCircle, label: 'Help & Support', description: 'Get help with QuickPay', path: '/help' },
];

const Profile: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <MobileLayout>
      {/* Header */}
      <header className="gradient-primary px-4 pt-4 pb-8 safe-area-top rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-primary-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Profile</h1>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="text-primary-foreground">
            <h2 className="text-xl font-bold">John Doe</h2>
            <div className="flex items-center gap-2 mt-1 text-primary-foreground/80">
              <Phone className="w-4 h-4" />
              <span className="text-sm">+234 801 234 5678</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-primary-foreground/80">
              <Mail className="w-4 h-4" />
              <span className="text-sm">john@example.com</span>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Items */}
      <div className="px-4 py-6 -mt-4">
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => item.path && navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors",
                  index !== menuItems.length - 1 && "border-b border-border"
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">{item.label}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 mt-4 bg-destructive/10 rounded-2xl hover:bg-destructive/20 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-destructive/20 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className="font-semibold text-destructive">Log Out</span>
        </button>

        {/* App Version */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          QuickPay v1.0.0
        </p>
      </div>
    </MobileLayout>
  );
};

export default Profile;
