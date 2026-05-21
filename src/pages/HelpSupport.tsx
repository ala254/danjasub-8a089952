import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Mail, Send, Loader2, Code2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DeveloperInfo } from '@/components/developer/DeveloperInfo';

const HelpSupport: React.FC = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSending(true);
    // Simulate sending
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Message sent! We\'ll get back to you shortly.');
    setSubject('');
    setMessage('');
    setSending(false);
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/2348000000000?text=Hello%20Danjasub%20Support', '_blank');
  };

  const openEmail = () => {
    window.open('mailto:support@danjasub.com?subject=Support%20Request', '_blank');
  };

  return (
    <MobileLayout>
      <header className="gradient-hero px-4 pt-4 pb-6 safe-area-top rounded-b-[2rem]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold text-primary-foreground">Help & Support</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {/* Quick contact */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={openWhatsApp} className="flex flex-col items-center gap-2 p-4 bg-card rounded-2xl shadow-card hover:bg-muted/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-foreground">WhatsApp</span>
          </button>
          <button onClick={openEmail} className="flex flex-col items-center gap-2 p-4 bg-card rounded-2xl shadow-card hover:bg-muted/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">Email Us</span>
          </button>
        </div>

        {/* Contact form */}
        <div className="bg-card rounded-2xl shadow-card p-4 space-y-4">
          <h2 className="font-display font-bold text-foreground">Send a Message</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Subject</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What do you need help with?" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Message</label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue..." rows={4} />
          </div>
          <Button onClick={handleSubmit} disabled={sending} className="w-full">
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Send Message
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default HelpSupport;
