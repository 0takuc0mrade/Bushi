'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Solana chain ID in LI.FI's system
const SOLANA_CHAIN_ID = 1151111081099710;

// SOL native token address on Solana (LI.FI uses this identifier)
const SOL_TOKEN_ADDRESS = '11111111111111111111111111111111';

export default function LiFiBridge() {
  const [mounted, setMounted] = useState(false);
  const [Widget, setWidget] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    setMounted(true);
    // Dynamic import to completely bypass SSR/Turbopack static analysis
    import('@lifi/widget').then((mod) => {
      setWidget(() => mod.LiFiWidget);
    }).catch((err) => {
      console.error('[VaultID] Failed to load LI.FI widget:', err);
    });
  }, []);

  if (!mounted || !Widget) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#48A9A6] mb-4"></div>
        <p className="text-stone-500 dark:text-stone-400 text-sm">Loading bridge...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <Widget
        integrator="vaultid"
        config={{
          toChain: SOLANA_CHAIN_ID,
          toToken: SOL_TOKEN_ADDRESS,
          appearance: 'light',
          theme: {
            container: {
              borderRadius: '16px',
              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.08)',
              maxHeight: '70vh',
            },
            palette: {
              primary: { main: '#48A9A6' },
              secondary: { main: '#006a68' },
            },
            shape: {
              borderRadius: 12,
              borderRadiusSecondary: 8,
            },
          },
          walletConfig: {
            onConnect: () => {
              console.log('[VaultID] LI.FI wallet connect — Privy manages wallets');
            },
          },
        }}
      />
    </div>
  );
}
