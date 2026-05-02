'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Connection, PublicKey } from '@solana/web3.js';
import { fetchUsdcBalance } from '@/lib/bushiClient';
import Link from 'next/link';

const MOCK_NGN_RATE = 1_500; // 1 USDC ≈ ₦1,500

export default function TopBar() {
  const { user } = usePrivy();
  const [usdcBalance, setUsdcBalance] = useState<number>(0);

  const solanaWalletAddress = useMemo(() => {
    if (!user?.linkedAccounts) return null;
    const solanaAccount = user.linkedAccounts.find(
      (account: any) => account.type === 'wallet' && account.chainType === 'solana'
    );
    return (solanaAccount as any)?.address ?? null;
  }, [user]);

  useEffect(() => {
    async function loadBalance() {
      if (!solanaWalletAddress) return;
      try {
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
          'confirmed'
        );
        const pubkey = new PublicKey(solanaWalletAddress);
        const balance = await fetchUsdcBalance(connection, pubkey);
        setUsdcBalance(balance);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    }
    loadBalance();
  }, [solanaWalletAddress]);

  const ngnBalance = (usdcBalance * MOCK_NGN_RATE).toLocaleString('en-NG');

  return (
    <header className="hidden md:flex bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-md w-full h-16 sticky top-0 z-40 border-b border-stone-200 dark:border-stone-800 shadow-sm items-center justify-between px-8 transition-colors">
      <div className="flex items-center gap-4">
        {/* Breadcrumb / Page title area - can be customized per-page */}
      </div>
      <div className="flex items-center gap-6">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">search</span>
          <input
            className="bg-[#e8e1d9] dark:bg-stone-800 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#48A9A6]/50 text-[#1e1b17] dark:text-stone-200 w-64 placeholder-stone-500 dark:placeholder-stone-400 transition-all outline-none"
            placeholder="Search devices..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Balance Pill */}
          <Link
            href="/wallet"
            className="flex items-center gap-2 bg-[#48A9A6]/10 dark:bg-[#5BC4C1]/10 border border-[#48A9A6]/20 dark:border-[#5BC4C1]/20 text-[#48A9A6] dark:text-[#5BC4C1] rounded-full px-4 py-1.5 text-sm font-semibold hover:bg-[#48A9A6]/20 dark:hover:bg-[#5BC4C1]/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            <span>₦{ngnBalance}</span>
          </Link>
          <button className="p-2 text-stone-500 dark:text-stone-400 hover:text-[#48A9A6] dark:hover:text-[#5BC4C1] transition-colors rounded-full">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-stone-500 dark:text-stone-400 hover:text-[#48A9A6] dark:hover:text-[#5BC4C1] transition-colors rounded-full">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
}
