import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface Settings {
  id: string;
  airtime_enabled: boolean;
  data_enabled: boolean;
  bills_enabled: boolean;
  min_funding_amount: number;
  transaction_charge: number;
}

export const AdminSettingsTab: React.FC = () => {
  const { toast } = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('app_settings').select('*').limit(1).maybeSingle();
    if (data) setS({
      id: data.id,
      airtime_enabled: data.airtime_enabled,
      data_enabled: data.data_enabled,
      bills_enabled: data.bills_enabled,
      min_funding_amount: Number(data.min_funding_amount),
      transaction_charge: Number(data.transaction_charge),
    });
  };

  useEffect(() => { load(); }, []);

  const update = async (patch: Partial<Settings>) => {
    if (!s) return;
    setSaving(true);
    const { error } = await supabase.from('app_settings').update(patch).eq('id', s.id);
    setSaving(false);
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Settings saved' });
      setS({ ...s, ...patch });
    }
  };

  if (!s) return <p className="text-center text-muted-foreground text-sm py-8">Loading…</p>;

  return (
    <div className="space-y-3">
      <Card className="border-0 bg-card/80">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-sm">Service Toggles</h3>
          <ToggleRow label="Airtime" value={s.airtime_enabled} onChange={v => update({ airtime_enabled: v })} disabled={saving} />
          <ToggleRow label="Data" value={s.data_enabled} onChange={v => update({ data_enabled: v })} disabled={saving} />
          <ToggleRow label="Bills (TV / Electricity)" value={s.bills_enabled} onChange={v => update({ bills_enabled: v })} disabled={saving} />
        </CardContent>
      </Card>

      <Card className="border-0 bg-card/80">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-sm">Funding & Charges</h3>
          <NumberRow
            label="Minimum funding amount (₦)"
            initial={s.min_funding_amount}
            onSave={(v) => update({ min_funding_amount: v })}
          />
          <NumberRow
            label="Transaction charge (₦)"
            initial={s.transaction_charge}
            onSave={(v) => update({ transaction_charge: v })}
          />
        </CardContent>
      </Card>
    </div>
  );
};

const ToggleRow: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ label, value, onChange, disabled }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm">{label}</span>
    <Switch checked={value} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

const NumberRow: React.FC<{ label: string; initial: number; onSave: (v: number) => void }> = ({ label, initial, onSave }) => {
  const [val, setVal] = useState(String(initial));
  useEffect(() => setVal(String(initial)), [initial]);
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex gap-2">
        <Input type="number" value={val} onChange={e => setVal(e.target.value)} className="h-9 text-sm" />
        <Button size="sm" variant="soft" onClick={() => onSave(Number(val) || 0)}>Save</Button>
      </div>
    </div>
  );
};
