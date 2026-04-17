import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { fetchPlans } from '@/lib/api';
import { Trash2, Plus, RefreshCw, Loader2 } from 'lucide-react';

interface AirtimeRow {
  id: string;
  network: string;
  markup_percent: number;
  is_active: boolean;
}

interface DataPlanRow {
  id: string;
  network: string;
  plan_id: string;
  plan_name: string | null;
  cost_price: number;
  selling_price: number;
  is_active: boolean;
}

interface SmePlugPlan {
  id: number | string;
  name?: string;
  plan_name?: string;
  amount?: number;
  price?: number;
  network_id?: number;
  validity?: string;
}

const networks = ['mtn', 'airtel', 'glo', '9mobile'] as const;
const networkIdMap: Record<string, number> = { mtn: 1, airtel: 2, glo: 3, '9mobile': 4 };

export const AdminPricingTab: React.FC = () => {
  const { toast } = useToast();
  const [airtime, setAirtime] = useState<AirtimeRow[]>([]);
  const [dataRows, setDataRows] = useState<DataPlanRow[]>([]);
  const [selectedNet, setSelectedNet] = useState<string>('mtn');
  const [livePlans, setLivePlans] = useState<SmePlugPlan[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);

  const load = useCallback(async () => {
    const [{ data: a }, { data: d }] = await Promise.all([
      supabase.from('airtime_pricing').select('*').order('network'),
      supabase.from('data_plan_pricing').select('*').order('network').order('selling_price'),
    ]);
    setAirtime((a || []).map(r => ({ ...r, markup_percent: Number(r.markup_percent) })));
    setDataRows((d || []).map(r => ({ ...r, cost_price: Number(r.cost_price), selling_price: Number(r.selling_price) })));
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadLivePlans = async (network: string) => {
    setLoadingLive(true);
    try {
      const res = await fetchPlans('data', network);
      const arr: SmePlugPlan[] = Array.isArray(res?.data) ? res.data : [];
      const filtered = arr.filter(p => !p.network_id || p.network_id === networkIdMap[network]);
      setLivePlans(filtered);
    } catch {
      setLivePlans([]);
    } finally {
      setLoadingLive(false);
    }
  };

  useEffect(() => { loadLivePlans(selectedNet); }, [selectedNet]);

  const updateAirtime = async (id: string, patch: Partial<AirtimeRow>) => {
    const { error } = await supabase.from('airtime_pricing').update(patch).eq('id', id);
    if (error) toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Saved' }); load(); }
  };

  const upsertDataPrice = async (network: string, plan: SmePlugPlan, sellingPrice: number) => {
    const planId = String(plan.id);
    const cost = Number(plan.amount || plan.price || 0);
    const planName = String(plan.name || plan.plan_name || `Plan ${planId}`);
    const { error } = await supabase.from('data_plan_pricing').upsert({
      network, plan_id: planId, plan_name: planName,
      cost_price: cost, selling_price: sellingPrice, is_active: true,
    }, { onConflict: 'network,plan_id' });
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else { toast({ title: `Saved ${planName}` }); load(); }
  };

  const removeDataPrice = async (id: string) => {
    const { error } = await supabase.from('data_plan_pricing').delete().eq('id', id);
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Removed' }); load(); }
  };

  return (
    <div className="space-y-4">
      {/* Airtime markup */}
      <Card className="border-0 bg-card/80">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Airtime Markup (%)</h3>
          <p className="text-xs text-muted-foreground">User pays: face value × (1 + markup%)</p>
          <div className="space-y-2">
            {airtime.map(row => (
              <AirtimeRowEditor key={row.id} row={row} onSave={updateAirtime} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data plan pricing */}
      <Card className="border-0 bg-card/80">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Data Plan Pricing</h3>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => loadLivePlans(selectedNet)}>
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
          <Select value={selectedNet} onValueChange={setSelectedNet}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {networks.map(n => <SelectItem key={n} value={n} className="uppercase">{n}</SelectItem>)}
            </SelectContent>
          </Select>

          {loadingLive ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {livePlans.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No live plans returned by SMEPlug</p>
              )}
              {livePlans.map(plan => {
                const planId = String(plan.id);
                const cost = Number(plan.amount || plan.price || 0);
                const existing = dataRows.find(r => r.network === selectedNet && r.plan_id === planId);
                return (
                  <DataPlanRowEditor
                    key={planId}
                    plan={plan}
                    cost={cost}
                    existing={existing}
                    onSave={(price) => upsertDataPrice(selectedNet, plan, price)}
                    onRemove={existing ? () => removeDataPrice(existing.id) : undefined}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AirtimeRowEditor: React.FC<{ row: AirtimeRow; onSave: (id: string, patch: Partial<AirtimeRow>) => void }> = ({ row, onSave }) => {
  const [val, setVal] = useState(String(row.markup_percent));
  return (
    <div className="flex items-center gap-2">
      <span className="uppercase text-xs font-semibold w-16">{row.network}</span>
      <Input
        type="number"
        step="0.1"
        value={val}
        onChange={e => setVal(e.target.value)}
        className="h-8 text-xs"
      />
      <span className="text-xs text-muted-foreground">%</span>
      <Button size="sm" variant="soft" className="h-8 text-xs" onClick={() => onSave(row.id, { markup_percent: Number(val) || 0 })}>
        Save
      </Button>
    </div>
  );
};

const DataPlanRowEditor: React.FC<{
  plan: SmePlugPlan;
  cost: number;
  existing?: DataPlanRow;
  onSave: (price: number) => void;
  onRemove?: () => void;
}> = ({ plan, cost, existing, onSave, onRemove }) => {
  const [price, setPrice] = useState(String(existing?.selling_price ?? cost));
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border bg-background/50">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{plan.name || plan.plan_name || `Plan ${plan.id}`}</p>
        <p className="text-[10px] text-muted-foreground">Cost: ₦{cost.toLocaleString()}</p>
      </div>
      <Input
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
        className="h-8 text-xs w-20"
        placeholder="Sell"
      />
      <Button size="sm" variant="soft" className="h-8 px-2" onClick={() => onSave(Number(price) || 0)}>
        <Plus className="h-3 w-3" />
      </Button>
      {onRemove && (
        <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
