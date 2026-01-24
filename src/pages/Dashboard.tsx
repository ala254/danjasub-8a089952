import React, { useState } from 'react';
import { Bell, User } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { WalletCard } from '@/components/dashboard/WalletCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { Transaction } from '@/components/dashboard/TransactionItem';
import { useNavigate } from 'react-router-dom';

// Demo data
const demoTransactions: Transaction[] = [
  {
    id: '1',
    type: 'airtime',
    title: 'MTN Airtime',
    description: '08012345678',
    amount: 1000,
    status: 'success',
    date: '2024-01-15',
  },
  {
    id: '2',
    type: 'data',
    title: 'Glo Data - 2GB',
    description: '08098765432',
    amount: 500,
    status: 'success',
    date: '2024-01-14',
  },
  {
    id: '3',
    type: 'fund',
    title: 'Wallet Funded',
    description: 'Via Paystack',
    amount: 5000,
    status: 'success',
    date: '2024-01-13',
  },
  {
    id: '4',
    type: 'electricity',
    title: 'EKEDC Prepaid',
    description: 'Meter: 45678901234',
    amount: 3000,
    status: 'pending',
    date: '2024-01-12',
  },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [balance] = useState(25750.00);

  const handleFundWallet = () => {
    navigate('/fund-wallet');
  };

  const handleWithdraw = () => {
    navigate('/withdraw');
  };

  const handleActionClick = (actionId: string) => {
    switch (actionId) {
      case 'airtime':
        navigate('/buy-airtime');
        break;
      case 'data':
        navigate('/buy-data');
        break;
      case 'electricity':
        navigate('/pay-electricity');
        break;
      case 'tv':
        navigate('/pay-tv');
        break;
      case 'more':
        navigate('/services');
        break;
    }
  };

  return (
    <MobileLayout>
      {/* Header */}
      <header className="px-4 pt-4 pb-2 safe-area-top">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-xl font-bold text-foreground">John Doe</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center"
            >
              <User className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Wallet Card */}
        <WalletCard
          balance={balance}
          onFundWallet={handleFundWallet}
          onWithdraw={handleWithdraw}
        />
      </header>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        <QuickActions onActionClick={handleActionClick} />
        
        <RecentTransactions
          transactions={demoTransactions}
          onViewAll={() => navigate('/history')}
          onTransactionClick={(tx) => navigate(`/transaction/${tx.id}`)}
        />
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
