import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import { getCurrentAppUser } from '@/services/auth.service';
import { logAppOpen } from '@/services/analytics.service';
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

    // Belt-and-suspenders: never leave the app stuck on the loading screen
    // if the session check hangs for some unforeseen reason.
    setTimeout(() => set({ isLoading: false }), 5000);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        set({ session: data.session });
        if (data.session) {
          await get().refreshAppUser();
          logAppOpen();
        }
      })
      .catch(() => {
        // A blocked/unavailable storage adapter (e.g. Safari with cookies
        // disabled) rejects getSession() — fall back to a signed-out state
        // instead of leaving the app stuck on the loading screen forever.
        set({ session: null, appUser: null });
      })
      .finally(() => {
        set({ isLoading: false });
      });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      try {
        if (session) {
          await get().refreshAppUser();
        } else {
          set({ appUser: null });
        }
      } finally {
        set({ isLoading: false });
      }
    });
  },
}));
