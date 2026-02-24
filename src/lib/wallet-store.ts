'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  setAddress: (address: string | null) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      setAddress: (address) =>
        set({
          address,
          isConnected: !!address,
        }),
      disconnect: () =>
        set({
          address: null,
          isConnected: false,
        }),
    }),
    {
      name: 'wallet-storage',
    }
  )
);
