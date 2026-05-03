import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const SERVICES = ['airtime', 'data'] as const;
const NETWORKS = ['mtn', 'airtel', 'glo', '9mobile'] as const;
const PROVIDERS = ['smeplug', 'inkotasub'] as const;

type Service = typeof SERVICES[number];
type Network = typeof NETWORKS[number];

interface RoutingRow {
  id: string;
  service_type: Service;
  network: Network;
  provider: string;
}

export const AdminRoutingTab: React.FC = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<RoutingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('provider_routing')
      .select('id, service_type, network, provider');
    if (error) {
      toast({ title: 'Failed to load routing', description: error.message, variant: 'destructive' });
    } else {
      setRows((data || []) as RoutingRow[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const getProvider = (service: Service, network: Network) =>
    rows.find(r => r.service_type === service && r.network === network)?.provider || 'smeplug';

  const setProvider = async (service: Service, network: Network, provider: string) => {
    const key = `${service}:${network}`;
    setSaving(key);
    const { error } = await supabase
      .from('provider_routing')
      .upsert(
        { service_type: service, network, provider },
        { onConflict: 'service_type,network' }
      );
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${service.toUpperCase()} • ${network.toUpperCase()} → ${provider}` });
      await load();
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-card/80">
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-sm">Provider Routing</h3>
          <p className="text-xs text-muted-foreground">
            Choose which provider handles each service & network. Defaults to SMEPlug.
          </p>
        </CardContent>
      </Card>

      {SERVICES.map(service => (
        <Card key={service} className="border-0 bg-card/80">
          <CardContent className="p-4 space-y-3">
            <h4 className="font-semibold text-sm capitalize">{service}</h4>
            <div className="space-y-2">
              {NETWORKS.map(network => {
                const key = `${service}:${network}`;
                const current = getProvider(service, network);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="uppercase text-xs font-semibold w-20">{network}</span>
                    <Select
                      value={current}
                      onValueChange={(v) => setProvider(service, network, v)}
                      disabled={saving === key}
                    >
                      <SelectTrigger className="h-9 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDERS.map(p => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {saving === key && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
