import React, { useEffect, useState } from 'react';
import { ArrowLeft, User, Shield, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Phone, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  path?: string;
}

const menuItems: MenuItem[] = [
  { icon: User, label: 'Personal Information', description: 'Update your profile', path: '/profile/edit' },
  { icon: Shield, label: 'Security', description: 'PIN & password', path: '/profile/security' },
  { icon: CreditCard, label: 'Payment Methods', description: 'Cards & bank accounts', path: '/profile/payments' },
  { icon: Bell, label: 'Notifications', description: 'Customize alerts', path: '/profile/notifications' },
  { icon: HelpCircle, label: 'Help & Support', description: 'Get help', path: '/help' },
];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const fullName = user?.user_metadata?.full_name || 'User';
  const phone = user?.user_metadata?.phone || '';
  const email = user?.email || '';

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <MobileLayout>
      <header className="gradient-hero px-4 pt-4 pb-8 safe-area-top rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-foreground/5 rounded-full -translate-y-10 translate-x-10 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center text-primary-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-display font-bold text-primary-foreground">Profile</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/15 flex items-center justify-center backdrop-blur-sm">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-primary-foreground">
              <h2 className="text-lg font-display font-bold">{fullName}</h2>
              {phone && (
                <div className="flex items-center gap-1.5 mt-0.5 text-primary-foreground/70">
                  <Phone className="w-3 h-3" />
                  <span className="text-xs">{phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-0.5 text-primary-foreground/70">
                <Mail className="w-3 h-3" />
                <span className="text-xs">{email}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 -mt-4">
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => item.path && navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors",
                  index !== menuItems.length - 1 && "border-b border-border"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm text-foreground">{item.label}</p>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-3 p-4 mt-4 bg-primary/8 rounded-2xl hover:bg-primary/15 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-foreground">Admin Dashboard</p>
              <p className="text-xs text-muted-foreground">Manage users & transactions</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 mt-4 bg-destructive/8 rounded-2xl hover:bg-destructive/15 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
            <LogOut className="w-4.5 h-4.5 text-destructive" />
          </div>
          <span className="font-semibold text-sm text-destructive">Log Out</span>
        </button>

        <p className="text-center text-xs text-muted-foreground mt-8">Danjasub v1.0.0</p>
      </div>
    </MobileLayout>
  );
};

export default Profile;
