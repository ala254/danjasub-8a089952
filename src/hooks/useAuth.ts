import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Send a 6-digit OTP to the user's email.
   * `shouldCreateUser` controls whether new accounts are created.
   */
  const sendEmailOtp = async (
    email: string,
    opts?: { fullName?: string; phone?: string; shouldCreateUser?: boolean },
  ) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: opts?.shouldCreateUser ?? false,
        data: opts?.fullName || opts?.phone
          ? { full_name: opts?.fullName, phone: opts?.phone }
          : undefined,
      },
    });
    return { error };
  };

  /** Verify the 6-digit OTP — establishes a session. */
  const verifyEmailOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { data, error };
  };

  const signOut = async () => {
    sessionStorage.removeItem('passcode_unlocked');
    await supabase.auth.signOut();
  };

  return { user, session, loading, sendEmailOtp, verifyEmailOtp, signOut };
};
