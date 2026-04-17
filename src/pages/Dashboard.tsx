import React from 'react';
import { Bell, User } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { WalletCard } from '@/components/dashboard/WalletCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useTransactions } from '@/hooks/useTransactions';
import { useAppSettings, useSuspensionStatus } from '@/hooks/useAppSettings';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, loading: walletLoading } = useWallet();
  const { transactions, loading: txLoading } = useTransactions(10);

  const { transactions, loading: txLoading } = useTransactions(10);
  const { settings } = useAppSettings();
  const { suspended, reason } = useSuspensionStatus();

  const userName = user?.user_metadata?.full_name || 'User';
  const firstName = userName.split(' ')[0];

  const disabledIds: string[] = [];
  if (settings) {
    if (!settings.airtime_enabled) disabledIds.push('airtime');
    if (!settings.data_enabled) disabledIds.push('data');
    if (!settings.bills_enabled) { disabledIds.push('electricity'); disabledIds.push('tv'); disabledIds.push('more'); }
  }

  const handleActionClick = (actionId: string) => {
    if (suspended) { toast.error('Your account is suspended'); return; }
    const routes: Record<string, string> = {
      airtime: '/buy-airtime',
      data: '/buy-data',
      electricity: '/pay-bills',
      tv: '/pay-bills',
      more: '/pay-bills',
    };
    navigate(routes[actionId] || '/dashboard');
  };

  const mappedTransactions = transactions.map(tx => ({
    id: tx.id,
    type: tx.type as 'airtime' | 'data' | 'electricity' | 'tv' | 'fund' | 'withdraw',
    title: tx.title || tx.type,
    description: tx.description || '',
    amount: tx.amount,
    status: tx.status as 'success' | 'pending' | 'failed',
    date: new Date(tx.created_at).toLocaleDateString(),
  }));

  return (
    <MobileLayout>
      {/* Header */}
      <header className="px-4 pt-4 pb-2 safe-area-top">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Welcome back</p>
            <h1 className="text-xl font-display font-bold text-foreground">{firstName} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"
            >
              <User className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>

        <WalletCard
          balance={walletLoading ? 0 : balance}
          onFundWallet={() => navigate('/fund-wallet')}
          onWithdraw={() => navigate('/withdraw')}
        />
      </header>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        <QuickActions onActionClick={handleActionClick} />
        <RecentTransactions
          transactions={mappedTransactions}
          onViewAll={() => navigate('/history')}
          onTransactionClick={(tx) => navigate(`/transaction/${tx.id}`)}
          loading={txLoading}
        />
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
