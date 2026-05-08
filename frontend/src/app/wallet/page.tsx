'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Connection, PublicKey } from '@solana/web3.js';
import { fetchUsdcBalance } from '@/lib/bushiClient';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import ThemeToggle from '../components/ThemeToggle';

const LiFiBridge = dynamic(() => import('../components/LiFiBridge'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#48A9A6] mb-4"></div>
      <p className="text-stone-500 dark:text-stone-400 text-sm">Loading bridge...</p>
    </div>
  ),
});

const MOCK_NGN_RATE = 1_500; // 1 USDC ≈ ₦1,500

export default function WalletPage() {
  const { ready, authenticated, user } = usePrivy();
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Modal state
  const [showResolvaModal, setShowResolvaModal] = useState(false);
  const [showBridgeModal, setShowBridgeModal] = useState(false);
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

  // Mock conversion (Resolva)
  const parsedNgn = parseFloat(ngnAmount.replace(/,/g, '')) || 0;
  const estimatedUsdc = parsedNgn / MOCK_NGN_RATE;

  const handleProceed = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowResolvaModal(false);
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
              <h1 className="font-semibold tracking-tight text-[#1e1b17] dark:text-stone-100">VaultID</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="VaultID" width={28} height={28} className="rounded-full" />
                <span className="text-xl font-bold text-[#48A9A6] dark:text-[#5BC4C1]">VaultID</span>
              </div>
            </div>
          </div>
        </header>

        {/* ===== CONTENT ===== */}
        <div className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full max-w-5xl mx-auto">

          {/* Desktop Header */}
          <div className="hidden md:block mb-8">
            <h1 className="text-[32px] font-bold text-[#1e1b17] dark:text-stone-100 mb-2">VaultID Vault</h1>
            <p className="text-stone-500 dark:text-stone-400 text-lg">Fund your wallet to pay for on-chain transactions and bounty escrows.</p>
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
              {/* Dual Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 self-start md:self-auto">
                <button
                  onClick={() => setShowResolvaModal(true)}
                  className="bg-white text-[#48A9A6] font-bold px-5 py-3 rounded-xl hover:bg-white/90 transition-all active:scale-95 flex items-center gap-2 shadow-md text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance</span>
                  Top Up with Naira
                </button>
                <button
                  onClick={() => setShowBridgeModal(true)}
                  className="bg-white/15 backdrop-blur-sm text-white font-bold px-5 py-3 rounded-xl hover:bg-white/25 transition-all active:scale-95 flex items-center gap-2 border border-white/30 text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                  Bridge Crypto
                </button>
              </div>
            </div>
          </div>

          {/* ===== FUNDING OPTIONS CARDS ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Resolva Card */}
            <button
              onClick={() => setShowResolvaModal(true)}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-gray-100 dark:border-stone-800 shadow-sm p-6 text-left hover:shadow-md hover:border-[#48A9A6]/30 dark:hover:border-[#5BC4C1]/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <span className="material-symbols-outlined text-xl">account_balance</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-stone-100 group-hover:text-[#48A9A6] dark:group-hover:text-[#5BC4C1] transition-colors">Naira On-Ramp</h3>
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Phase 2</span>
                </div>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                Fund your wallet via Nigerian bank transfer, debit card, or USSD. Powered by Resolva.
              </p>
            </button>

            {/* LI.FI Bridge Card */}
            <button
              onClick={() => setShowBridgeModal(true)}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-gray-100 dark:border-stone-800 shadow-sm p-6 text-left hover:shadow-md hover:border-[#48A9A6]/30 dark:hover:border-[#5BC4C1]/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <span className="material-symbols-outlined text-xl">swap_horiz</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-stone-100 group-hover:text-[#48A9A6] dark:group-hover:text-[#5BC4C1] transition-colors">Cross-Chain Bridge</h3>
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Live</span>
                </div>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                Bridge assets from Ethereum, Base, Polygon, or any EVM chain to Solana. Powered by LI.FI.
              </p>
            </button>
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
                <p className="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold mb-1">Funding Options</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#48A9A6] dark:text-[#5BC4C1] bg-[#48A9A6]/10 dark:bg-[#5BC4C1]/10 px-2 py-0.5 rounded-full">LI.FI Bridge</span>
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">Resolva (Soon)</span>
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
                Your funding and transaction history will appear here once bridging or on-ramp activity is detected.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RESOLVA MOCK MODAL (Naira On-Ramp — Phase 2) ===== */}
      {showResolvaModal && (
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
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <span className="material-symbols-outlined text-[18px]">account_balance</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100">Top Up via Resolva</h3>
                  </div>
                  <button
                    onClick={() => { setShowResolvaModal(false); setNgnAmount(''); }}
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

      {/* ===== LI.FI BRIDGE MODAL ===== */}
      {showBridgeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-stone-800 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100">Bridge to Solana</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Powered by LI.FI</p>
                </div>
              </div>
              <button
                onClick={() => setShowBridgeModal(false)}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* LI.FI Widget */}
            <div className="p-4 max-h-[75vh] overflow-y-auto">
              <LiFiBridge />
            </div>
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
