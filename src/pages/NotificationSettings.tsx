import React, { useState } from 'react';
import { ArrowLeft, Bell, MessageSquare, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface NotifSetting {
  key: string;
  icon: React.ElementType;
  label: string;
  description: string;
}

const settings: NotifSetting[] = [
  { key: 'push', icon: Bell, label: 'Push Notifications', description: 'Get notified about transactions instantly' },
  { key: 'sms', icon: MessageSquare, label: 'SMS Alerts', description: 'Receive SMS for important updates' },
  { key: 'email', icon: Mail, label: 'Email Alerts', description: 'Get transaction receipts via email' },
];

const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const [toggles, setToggles] = useState<Record<string, boolean>>({ push: true, sms: false, email: true });

  const handleToggle = (key: string) => {
    setToggles(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success(`${settings.find(s => s.key === key)?.label} ${updated[key] ? 'enabled' : 'disabled'}`);
      return updated;
    });
  };

  return (
    <MobileLayout>
      <header className="gradient-hero px-4 pt-4 pb-6 safe-area-top rounded-b-[2rem]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold text-primary-foreground">Notifications</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          {settings.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className={`flex items-center gap-3 p-4 ${i !== settings.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
                <Switch checked={toggles[s.key]} onCheckedChange={() => handleToggle(s.key)} />
              </div>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
};

export default NotificationSettings;
