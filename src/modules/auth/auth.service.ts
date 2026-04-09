import { supabase } from '../../lib/supabase';
import { AuthResponse } from '@supabase/supabase-js';

export const authService = {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async signUp(email: string, password: string): Promise<AuthResponse> {
    const redirectUrl = import.meta.env.VITE_REDIRECT_URL || window.location.origin;
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getSession() {
    return await supabase.auth.getSession();
  }
};
