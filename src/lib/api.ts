import { supabase } from '@/integrations/supabase/client';

const invokeFunction = async (functionName: string, body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });

  if (error) throw new Error(error.message || 'Request failed');
  return data;
};

export const initializePayment = async (amount: number, email?: string) => {
  return invokeFunction('paystack-initialize', { amount, email });
};

export const verifyPayment = async (reference: string) => {
  return invokeFunction('paystack-verify', { reference });
};

export const purchaseVTU = async (params: {
  service_type: 'airtime' | 'data';
  network: string;
  phone: string;
  amount: number;
  plan_id?: string;
}) => {
  return invokeFunction('vtu-purchase', params);
};

export const payBill = async (params: {
  service_type: 'cable' | 'electricity';
  provider: string;
  smart_card_number?: string;
  meter_number?: string;
  meter_type?: string;
  amount: number;
  plan_id?: string;
  phone?: string;
}) => {
  return invokeFunction('bill-payment', params);
};

export const fetchPlans = async (service: 'data' | 'cable' | 'electricity', network?: string) => {
  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smeplug-plans`);
  url.searchParams.set('service', service);
  if (network) url.searchParams.set('network', network);

  const session = await supabase.auth.getSession();
  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${session.data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch plans');
  return res.json();
};

export const retryTransaction = async (transactionId: string) => {
  return invokeFunction('retry-transaction', { transaction_id: transactionId });
};
