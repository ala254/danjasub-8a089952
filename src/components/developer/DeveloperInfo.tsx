import React from 'react';
import { Mail, MessageCircle, User, ExternalLink, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeveloperInfoProps {
  className?: string;
  compact?: boolean;
  showTitle?: boolean;
}

export const DeveloperInfo: React.FC<DeveloperInfoProps> = ({
  className,
  compact = false,
  showTitle = true,
}) => {
  const handleWhatsApp = () => {
    window.open('https://wa.me/2349057352833', '_blank');
  };

  const handleEmail = () => {
    window.open('mailto:alaminkabir9999@gmail.com', '_blank');
  };

  if (compact) {
    return (
      <div className={cn("bg-card rounded-2xl shadow-card p-4", className)}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-display font-bold text-sm text-foreground">Developer Info</h3>
          </div>
        )}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Alamin Kabir</p>
            <p className="text-xs text-muted-foreground">Full Stack Developer</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors text-xs font-semibold"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </button>
          <button
            onClick={handleEmail}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold"
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-2xl shadow-card overflow-hidden", className)}>
      <div className="p-5">
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">Developer Information</h3>
          </div>
        )}

        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-base text-foreground">Alamin Kabir</p>
            <p className="text-xs text-muted-foreground">Lead Developer & Architect</p>
            <p className="text-xs text-muted-foreground mt-0.5">alaminkabir9999@gmail.com</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-green-500/10 hover:bg-green-500/15 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-green-700 dark:text-green-400">Chat on WhatsApp</p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70">09057352833</p>
            </div>
            <ExternalLink className="w-4 h-4 text-green-600/50" />
          </button>

          <button
            onClick={handleEmail}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-primary/8 hover:bg-primary/12 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-primary">Send Email</p>
              <p className="text-xs text-primary/70">alaminkabir9999@gmail.com</p>
            </div>
            <ExternalLink className="w-4 h-4 text-primary/50" />
          </button>

          <button
            onClick={() => window.open('https://wa.me/2349057352833?text=Hello%20Alamin%20Kabir,%20I%20have%20a%20question%20about%20Danjasub', '_blank')}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-foreground">Contact Developer</p>
              <p className="text-xs text-muted-foreground">Get help or report an issue</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeveloperInfo;
