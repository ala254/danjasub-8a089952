import { supabase } from '@/integrations/supabase/client';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

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
  wallet_pin?: string;
}) => {
  return invokeFunction('vtu-purchase', params);
};
