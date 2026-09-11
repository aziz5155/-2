import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import { getCurrentAppUser } from '@/services/auth.service';
import { AppUser } from '@/types/models';

interface AuthState {
  session: Session | null;
  appUser: AppUser | null;
  isLoading: boolean;
  initialized: boolean;
  refreshAppUser: () => Promise<void>;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  appUser: null,
  isLoading: true,
  initialized: false,

  refreshAppUser: async () => {
    try {
      const appUser = await getCurrentAppUser();
      set({ appUser });
    } catch {
      set({ appUser: null });
    }
  },

  init: () => {
    if (get().initialized) return;
    set({ initialized: true });

    supabase.auth.getSession().then(async ({ data }) => {
      set({ session: data.session });
      if (data.session) await get().refreshAppUser();
      set({ isLoading: false });
    });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session) {
        await get().refreshAppUser();
      } else {
        set({ appUser: null });
      }
      set({ isLoading: false });
    });
  },
}));
