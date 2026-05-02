'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Connection, PublicKey } from '@solana/web3.js';
import { fetchUsdcBalance } from '@/lib/bushiClient';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';

const MOCK_NGN_RATE = 1_500; // 1 USDC ≈ ₦1,500

export default function WalletPage() {
  const { ready, authenticated, user } = usePrivy();
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [ngnAmount, setNgnAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const solanaWalletAddress = useMemo(() => {
    if (!user?.linkedAccounts) return null;
    const solanaAccount = user.linkedAccounts.find(
      (account: any) => account.type === 'wallet' && account.chainType === 'solana'
    );
    return (solanaAccount as any)?.address ?? null;
  }, [user]);

  useEffect(() => {
    async function loadBalance() {
      if (!solanaWalletAddress) { setLoading(false); return; }
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
      } finally {
        setLoading(false);
      }
    }
    loadBalance();
  }, [solanaWalletAddress]);

  const ngnBalance = (usdcBalance * MOCK_NGN_RATE).toLocaleString('en-NG');
  const truncatedAddress = solanaWalletAddress
    ? `${solanaWalletAddress.slice(0, 6)}...${solanaWalletAddress.slice(-6)}`
    : '—';

  const handleCopy = () => {
    if (solanaWalletAddress) {
      navigator.clipboard.writeText(solanaWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mock conversion
  const parsedNgn = parseFloat(ngnAmount.replace(/,/g, '')) || 0;
  const estimatedUsdc = parsedNgn / MOCK_NGN_RATE;

  const handleProceed = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowModal(false);
      setNgnAmount('');
    }, 3000);
  };

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFCFB] dark:bg-[#121212]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#48A9A6]"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[#FDFCFB] dark:bg-[#121212] transition-colors pb-24 md:pb-8">

        {/* ===== MOBILE HEADER ===== */}
        <header className="md:hidden bg-[#FDFCFB] dark:bg-[#121212] shadow-sm dark:shadow-none border-b border-transparent dark:border-stone-800 sticky top-0 z-50 transition-colors">
          <div className="flex justify-between items-center w-full px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1]">arrow_back</span>
              </Link>
              <h1 className="font-semibold tracking-tight text-[#1e1b17] dark:text-stone-100">Bushi Vault</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="text-xl font-bold text-[#48A9A6] dark:text-[#5BC4C1]">Bushi</div>
            </div>
          </div>
        </header>

        {/* ===== CONTENT ===== */}
        <div className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full max-w-5xl mx-auto">

          {/* Desktop Header */}
          <div className="hidden md:block mb-8">
            <h1 className="text-[32px] font-bold text-[#1e1b17] dark:text-stone-100 mb-2">Bushi Vault</h1>
            <p className="text-stone-500 dark:text-stone-400 text-lg">Manage your funds and top up your wallet to pay for on-chain transactions.</p>
          </div>

          {/* ===== BALANCE CARD ===== */}
          <div className="bg-gradient-to-br from-[#48A9A6] to-[#2d7a78] dark:from-[#2d7a78] dark:to-[#1a4a49] rounded-2xl p-6 md:p-8 text-white shadow-lg mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">Total Balance</p>
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-10 w-48 rounded-lg"></div>
                ) : (
                  <>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">₦{ngnBalance}</h2>
                    <p className="text-white/60 text-sm mt-1">{usdcBalance.toFixed(2)} USDC</p>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-white text-[#48A9A6] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-all active:scale-95 flex items-center gap-2 shadow-md self-start md:self-auto"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Top Up via Resolva
              </button>
            </div>
          </div>

          {/* ===== WALLET DETAILS CARD ===== */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-gray-100 dark:border-stone-800 shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100 mb-4">Wallet Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-stone-800/50 rounded-xl p-4">
                <p className="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold mb-1">Public Key</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-800 dark:text-stone-200">{truncatedAddress}</span>
                  <button
                    onClick={handleCopy}
                    className="text-[#48A9A6] dark:text-[#5BC4C1] hover:text-[#2d7a78] transition-colors active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-stone-800/50 rounded-xl p-4">
                <p className="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold mb-1">Network</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-stone-200">Solana Devnet</span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-stone-800/50 rounded-xl p-4">
                <p className="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold mb-1">USDC Balance</p>
                <span className="text-sm font-semibold text-gray-800 dark:text-stone-200">{usdcBalance.toFixed(2)} USDC</span>
              </div>
              <div className="bg-gray-50 dark:bg-stone-800/50 rounded-xl p-4">
                <p className="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold mb-1">Fiat On-Ramp</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#48A9A6] dark:text-[#5BC4C1]">Resolva</span>
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Phase 2</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== TRANSACTION HISTORY PLACEHOLDER ===== */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-gray-100 dark:border-stone-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100">Transaction History</h3>
              <span className="bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs px-3 py-1 rounded-full font-semibold">Coming Soon</span>
            </div>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-stone-800 flex items-center justify-center text-gray-400 dark:text-stone-500 mb-3">
                <span className="material-symbols-outlined text-2xl">receipt_long</span>
              </div>
              <p className="text-gray-500 dark:text-stone-400 text-sm max-w-xs">
                Your funding and transaction history will appear here once the Resolva integration is live.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOCK CONVERSION MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 border border-gray-100 dark:border-stone-800 animate-in">
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100 mb-2">Sandbox Mode</h3>
                <p className="text-gray-500 dark:text-stone-400 text-sm">
                  Resolva integration pending Phase 2. This transaction was not processed.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100">Top Up via Resolva</h3>
                  <button
                    onClick={() => { setShowModal(false); setNgnAmount(''); }}
                    className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors rounded-full"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-stone-300 mb-2">
                    Enter amount in Naira (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-stone-400 dark:text-stone-500">₦</span>
                    <input
                      type="text"
                      value={ngnAmount}
                      onChange={(e) => setNgnAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                      placeholder="10,000"
                      className="w-full bg-gray-50 dark:bg-stone-800 border border-gray-200 dark:border-stone-700 rounded-xl py-4 pl-10 pr-4 text-xl font-bold text-gray-900 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 focus:ring-2 focus:ring-[#48A9A6]/50 focus:border-[#48A9A6] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Conversion Preview */}
                <div className="bg-gray-50 dark:bg-stone-800/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-stone-500 dark:text-stone-400">You pay</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-stone-200">
                      ₦{parsedNgn.toLocaleString('en-NG')}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-stone-200 dark:border-stone-700 my-2"></div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-stone-500 dark:text-stone-400">You receive</span>
                    <span className="text-sm font-bold text-[#48A9A6] dark:text-[#5BC4C1]">
                      {estimatedUsdc.toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-500 dark:text-stone-400">Rate</span>
                    <span className="text-xs text-stone-400 dark:text-stone-500">1 USDC ≈ ₦{MOCK_NGN_RATE.toLocaleString()}</span>
                  </div>
                </div>

                {/* Provider Badge */}
                <div className="flex items-center gap-2 mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg px-3 py-2">
                  <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 text-[18px]">info</span>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Powered by <strong>Resolva</strong>. Supports Nigerian bank transfers, cards, and USSD.
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={handleProceed}
                  disabled={parsedNgn < 100}
                  className={`w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    parsedNgn >= 100
                      ? 'bg-[#48A9A6] hover:bg-[#3d9290] shadow-md'
                      : 'bg-stone-300 dark:bg-stone-700 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                  Proceed to Resolva
                </button>
                {parsedNgn < 100 && parsedNgn > 0 && (
                  <p className="text-xs text-red-500 dark:text-red-400 text-center mt-2">Minimum top-up is ₦100</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-8 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-t-3xl border-t border-stone-100 dark:border-stone-800 shadow-sm text-xs font-medium">
        <Link className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-[#48A9A6] dark:hover:text-[#5BC4C1] transition-all" href="/">
          <span className="material-symbols-outlined mb-1">home</span>
          <span>Home</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-[#48A9A6] dark:hover:text-[#5BC4C1] transition-all" href="/verify">
          <span className="material-symbols-outlined mb-1">devices</span>
          <span>Verify</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-[#48A9A6] dark:hover:text-[#5BC4C1] transition-all" href="/explorer">
          <span className="material-symbols-outlined mb-1">public</span>
          <span>Explorer</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-[#48A9A6] dark:text-[#5BC4C1] bg-[#48A9A6]/10 dark:bg-[#5BC4C1]/10 rounded-xl px-4 py-1" href="/wallet">
          <span className="material-symbols-outlined mb-1">account_balance_wallet</span>
          <span>Vault</span>
        </Link>
      </nav>
    </>
  );
}
