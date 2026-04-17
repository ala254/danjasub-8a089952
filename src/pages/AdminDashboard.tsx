import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, ArrowLeftRight, Wallet, ArrowLeft, Plus, Minus, Search, Shield, RotateCcw, X, CalendarIcon, Ban, CheckCircle2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AdminPricingTab } from '@/components/admin/AdminPricingTab';
import { AdminSettingsTab } from '@/components/admin/AdminSettingsTab';
import { retryTransaction } from '@/lib/api';

interface AdminUser {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  created_at: string;
  balance: number;
  is_suspended?: boolean;
  total_tx?: number;
}

interface AdminTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  reference: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  user_name?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [walletDialog, setWalletDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [walletAction, setWalletAction] = useState<'credit' | 'debit'>('credit');
  const [walletAmount, setWalletAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Transaction filters
  const [txSearch, setTxSearch] = useState('');
  const [txStatus, setTxStatus] = useState<string>('all');
  const [txType, setTxType] = useState<string>('all');
  const [txDateFrom, setTxDateFrom] = useState<Date | undefined>();
  const [txDateTo, setTxDateTo] = useState<Date | undefined>();

  // Check admin role
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setChecking(false); return; }
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setIsAdmin(!!data);
      setChecking(false);
    };
    checkAdmin();
  }, [user]);

  const fetchUsers = useCallback(async () => {
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, phone, created_at');
    if (!profiles) return;

    const [{ data: wallets }, { data: statuses }, { data: txs }] = await Promise.all([
      supabase.from('wallets').select('user_id, balance'),
      supabase.from('user_status').select('user_id, is_suspended'),
      supabase.from('transactions').select('user_id'),
    ]);
    const walletMap = new Map((wallets || []).map(w => [w.user_id, Number(w.balance)]));
    const susMap = new Map((statuses || []).map(s => [s.user_id, s.is_suspended]));
    const txCount = new Map<string, number>();
    (txs || []).forEach(t => txCount.set(t.user_id, (txCount.get(t.user_id) || 0) + 1));

    setUsers(profiles.map(p => ({
      ...p,
      balance: walletMap.get(p.user_id) || 0,
      is_suspended: !!susMap.get(p.user_id),
      total_tx: txCount.get(p.user_id) || 0,
    })));
  }, []);

  const toggleSuspend = async (u: AdminUser) => {
    const next = !u.is_suspended;
    const { error } = await supabase.from('user_status').upsert({
      user_id: u.user_id,
      is_suspended: next,
      suspended_by: next ? user?.id : null,
      suspended_at: next ? new Date().toISOString() : null,
    }, { onConflict: 'user_id' });
    if (error) {
      toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: next ? 'User suspended' : 'User unsuspended' });
      fetchUsers();
    }
  };

  const fetchTransactions = useCallback(async () => {
    const { data } = await supabase
      .from('transactions')
      .select('id, user_id, amount, type, status, reference, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!data) return;

    const userIds = [...new Set(data.map(t => t.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
    const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name || 'Unknown']));

    setTransactions(data.map(t => ({
      ...t,
      metadata: t.metadata as Record<string, unknown> | null,
      user_name: nameMap.get(t.user_id) || 'Unknown',
    })));
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchTransactions();
    }
  }, [isAdmin, fetchUsers, fetchTransactions]);

  const handleWalletAction = async () => {
    if (!selectedUser || !walletAmount || Number(walletAmount) <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    const amt = Number(walletAmount);

    // Get current balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', selectedUser.user_id)
      .single();

    if (!wallet) {
      toast({ title: 'Wallet not found', variant: 'destructive' });
      setProcessing(false);
      return;
    }

    const currentBalance = Number(wallet.balance);
    const newBalance = walletAction === 'credit' ? currentBalance + amt : currentBalance - amt;

    if (newBalance < 0) {
      toast({ title: 'Insufficient balance for debit', variant: 'destructive' });
      setProcessing(false);
      return;
    }

    const { error } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', selectedUser.user_id);

    if (error) {
      toast({ title: 'Failed to update wallet', description: error.message, variant: 'destructive' });
    } else {
      // Log transaction
      await supabase.from('transactions').insert({
        user_id: selectedUser.user_id,
        amount: amt,
        type: walletAction === 'credit' ? 'admin_credit' : 'admin_debit',
        status: 'completed',
        metadata: { admin_id: user?.id, action: walletAction },
      });

      toast({ title: `Wallet ${walletAction}ed ₦${amt.toLocaleString()} successfully` });
      setWalletDialog(false);
      setWalletAmount('');
      fetchUsers();
      fetchTransactions();
    }
    setProcessing(false);
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone || '').includes(searchQuery)
  );

  const txTypes = Array.from(new Set(transactions.map(t => t.type)));
  const filteredTransactions = transactions.filter(tx => {
    if (txStatus !== 'all') {
      const norm = tx.status === 'completed' ? 'success' : tx.status;
      if (norm !== txStatus) return false;
    }
    if (txType !== 'all' && tx.type !== txType) return false;
    if (txSearch) {
      const q = txSearch.toLowerCase();
      const phone = String(tx.metadata?.phone || '').toLowerCase();
      const ref = (tx.reference || '').toLowerCase();
      if (
        !(tx.user_name || '').toLowerCase().includes(q) &&
        !phone.includes(q) &&
        !ref.includes(q)
      ) return false;
    }
    if (txDateFrom && new Date(tx.created_at) < txDateFrom) return false;
    if (txDateTo) {
      const end = new Date(txDateTo);
      end.setHours(23, 59, 59, 999);
      if (new Date(tx.created_at) > end) return false;
    }
    return true;
  });
  const hasFilters = !!(txSearch || txStatus !== 'all' || txType !== 'all' || txDateFrom || txDateTo);
  const clearFilters = () => {
    setTxSearch(''); setTxStatus('all'); setTxType('all'); setTxDateFrom(undefined); setTxDateTo(undefined);
  };

  const statusColor = (s: string) => {
    if (s === 'completed' || s === 'success') return 'bg-emerald-100 text-emerald-700';
    if (s === 'failed') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const totalRevenue = transactions
    .filter(t => (t.status === 'success' || t.status === 'completed') && ['airtime', 'data', 'cable', 'electricity'].includes(t.type))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (checking) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-screen gap-4 px-6">
          <Shield className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground text-center">You don't have admin privileges.</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-4 pt-6 pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl bg-card">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">Manage users & transactions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-0">
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{users.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-0">
            <CardContent className="p-3 text-center">
              <ArrowLeftRight className="h-5 w-5 mx-auto text-accent-foreground mb-1" />
              <p className="text-lg font-bold">{transactions.length}</p>
              <p className="text-[10px] text-muted-foreground">Transactions</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-0">
            <CardContent className="p-3 text-center">
              <Wallet className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
              <p className="text-lg font-bold">₦{totalRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Total Revenue (VTU)</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 bg-gradient-to-br from-secondary/50 to-secondary/20 border-0">
            <CardContent className="p-3 text-center">
              <Wallet className="h-5 w-5 mx-auto text-secondary-foreground mb-1" />
              <p className="text-lg font-bold">₦{users.reduce((a, u) => a + u.balance, 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Total User Balances</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="w-full">
            <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-3 mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {filteredUsers.map(u => (
              <Card key={u.user_id} className="border-0 bg-card/80">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{u.full_name || 'No Name'}</p>
                      <p className="text-xs text-muted-foreground">{u.phone || 'No phone'}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-bold text-sm">₦{u.balance.toLocaleString()}</p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="soft"
                          className="h-7 text-xs px-2"
                          onClick={() => { setSelectedUser(u); setWalletAction('credit'); setWalletDialog(true); }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Credit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2"
                          onClick={() => { setSelectedUser(u); setWalletAction('debit'); setWalletDialog(true); }}
                        >
                          <Minus className="h-3 w-3 mr-1" /> Debit
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-3 mt-3">
            {/* Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user, phone, reference..."
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={txStatus} onValueChange={setTxStatus}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={txType} onValueChange={setTxType}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {txTypes.map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-9 text-xs justify-start font-normal", !txDateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {txDateFrom ? format(txDateFrom, 'MMM d, yyyy') : 'From date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={txDateFrom} onSelect={setTxDateFrom} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-9 text-xs justify-start font-normal", !txDateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {txDateTo ? format(txDateTo, 'MMM d, yyyy') : 'To date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={txDateTo} onSelect={setTxDateTo} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{filteredTransactions.length} of {transactions.length}</span>
                {hasFilters && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>

            {filteredTransactions.map(tx => (
              <Card key={tx.id} className="border-0 bg-card/80">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">{tx.user_name}</p>
                      {tx.metadata?.api_message ? (
                        <p className="text-[10px] text-muted-foreground italic truncate">
                          {String(tx.metadata.api_message)}
                        </p>
                      ) : null}
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-bold text-sm">₦{Number(tx.amount).toLocaleString()}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                      {tx.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 mt-1"
                          onClick={async () => {
                            try {
                              toast({ title: 'Retrying transaction...' });
                              const result = await retryTransaction(tx.id);
                              if (result.status === 'success') {
                                toast({ title: 'Transaction retried successfully' });
                              } else {
                                toast({ title: result.message || 'Retry failed', variant: 'destructive' });
                              }
                              fetchTransactions();
                            } catch (e: unknown) {
                              toast({ title: e instanceof Error ? e.message : 'Retry failed', variant: 'destructive' });
                            }
                          }}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" /> Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredTransactions.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">
                {hasFilters ? 'No transactions match filters' : 'No transactions yet'}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Credit/Debit Dialog */}
      <Dialog open={walletDialog} onOpenChange={setWalletDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {walletAction === 'credit' ? 'Credit' : 'Debit'} Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium">{selectedUser?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground">Current balance: ₦{selectedUser?.balance.toLocaleString()}</p>
            </div>
            <Input
              type="number"
              placeholder="Enter amount"
              value={walletAmount}
              onChange={e => setWalletAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletDialog(false)}>Cancel</Button>
            <Button
              onClick={handleWalletAction}
              disabled={processing}
              variant={walletAction === 'credit' ? 'default' : 'destructive'}
            >
              {processing ? 'Processing...' : walletAction === 'credit' ? 'Credit' : 'Debit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default AdminDashboard;
