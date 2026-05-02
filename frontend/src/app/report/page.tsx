'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { getBushiProgram, buildMarkStolenTx } from '@/lib/bushiClient';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';

export default function ReportStolen() {
  const [imei, setImei] = useState('');
  const [email, setEmail] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();

  const solanaWalletAddress = useMemo(() => {
    if (!user?.linkedAccounts) return null;
    const solanaAccount = user.linkedAccounts.find(
      (account: any) => account.type === 'wallet' && account.chainType === 'solana'
    );
    return (solanaAccount as any)?.address ?? null;
  }, [user]);

  const signingWallet = useMemo(() => {
    if (!solanaWalletAddress || !wallets.length) return null;
    return wallets.find((w: any) => w.address === solanaWalletAddress)
      || wallets.find((w: any) => w.walletClientType === 'privy')
      || wallets[0]
      || null;
  }, [wallets, solanaWalletAddress]);

  const handleReport = async () => {
    if (imei.length !== 15 || !solanaWalletAddress) return;
    if (!signingWallet) {
      alert('Solana wallet is not ready for signing. Please refresh and try again.');
      return;
    }
    setLoading(true);

    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const pubkey = new PublicKey(solanaWalletAddress);
      const dummyWallet = {
        publicKey: pubkey,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any) => txs,
      };
      const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
      const program = getBushiProgram(provider);
      const transaction = await buildMarkStolenTx(program, connection, imei, pubkey, email || 'none');
      const serializedTx = transaction.serialize({ requireAllSignatures: false });
      const { signedTransaction } = await (signingWallet as any).signTransaction({
        transaction: serializedTx,
        chain: 'solana:devnet',
      });
      const txSig = await connection.sendRawTransaction(signedTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      await connection.confirmTransaction(txSig, 'confirmed');
      console.log('Device marked as stolen successfully:', txSig);
      router.push('/');
    } catch (error) {
      console.error('Failed to report device:', error);
      alert('Failed to report device. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== MOBILE HEADER ===== */}
      <header className="md:hidden bg-[#FDFCFB] dark:bg-stone-900 border-b border-stone-200/60 dark:border-stone-800 shadow-sm dark:shadow-none sticky top-0 z-50 transition-colors">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95">
              <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1]">arrow_back</span>
            </Link>
            <h1 className="font-semibold tracking-tight text-[#1e1b17] dark:text-stone-100">Report Stolen</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="text-xl font-bold text-[#48A9A6] dark:text-[#5BC4C1]">Bushi</div>
          </div>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <div className="flex-grow px-6 md:px-10 lg:px-16 py-6 md:py-10 max-w-4xl mx-auto w-full">
        {/* Desktop Page Header */}
        <div className="hidden md:block mb-8">
          <h1 className="text-[32px] font-bold text-[#1e1b17] dark:text-stone-100 mb-2">Report Stolen Device</h1>
          <p className="text-stone-500 dark:text-stone-400 text-lg">Initiate an emergency lockdown protocol for your missing hardware.</p>
        </div>

        {/* Critical Action Banner */}
        <div className="bg-[#ffdad6] dark:bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 dark:border-[#ba1a1a]/30 rounded-xl p-6 mb-6 md:mb-8 transition-colors">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#ba1a1a] dark:text-[#ffb4ab] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <div>
              <h2 className="text-xl font-bold text-[#ba1a1a] dark:text-[#ffb4ab] mb-2">Critical Action</h2>
              <p className="text-[#93000a]/80 dark:text-[#ffb4ab]/80 leading-relaxed">
                Flagging this device as stolen will lock its transferability immediately. All linked payment methods will be suspended, and the device will enter a hardened offline state until verified recovery.
              </p>
            </div>
          </div>
        </div>

        {/* IMEI Input (Mobile-style, shown on both) */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 shadow-sm p-6 mb-6 transition-colors">
          <div className="space-y-1">
            <label className="font-semibold text-sm text-stone-600 dark:text-stone-300 block" htmlFor="report-imei">Device IMEI</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-stone-400 dark:text-stone-500 group-focus-within:text-[#006a68] dark:group-focus-within:text-[#5BC4C1] transition-colors">lock</span>
              </div>
              <input
                className="block w-full pl-12 pr-4 py-4 bg-[#faf2ea] dark:bg-stone-950 border-transparent rounded-xl focus:ring-2 focus:ring-[#ba1a1a]/50 focus:border-[#ba1a1a] focus:bg-white dark:focus:bg-stone-800 text-[#1e1b17] dark:text-stone-100 text-xl tracking-widest placeholder:tracking-normal placeholder:text-stone-400 dark:placeholder-stone-500 transition-all outline-none"
                id="report-imei"
                maxLength={15}
                placeholder="Enter your 15-digit IMEI"
                type="text"
                value={imei}
                onChange={(e) => setImei(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
          </div>
        </div>

        {/* Recovery Details Card */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 shadow-sm overflow-hidden mb-6 md:mb-8 transition-colors">
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-[#e8e1d9] dark:border-stone-800">
            <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1]">shield</span>
            <h3 className="text-xl font-semibold text-[#1e1b17] dark:text-stone-100">Recovery Details</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <label className="font-semibold text-sm text-stone-600 dark:text-stone-300 block" htmlFor="recovery-email">Recovery Contact Email</label>
              <input
                className="block w-full px-4 py-3 bg-[#faf2ea] dark:bg-stone-950 border-transparent rounded-xl focus:ring-2 focus:ring-[#48a9a6] focus:border-[#48a9a6] focus:bg-white dark:focus:bg-stone-800 text-[#1e1b17] dark:text-stone-100 placeholder:text-stone-400 dark:placeholder-stone-500 transition-all outline-none"
                id="recovery-email"
                placeholder="e.g. trusted.contact@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                We will send unlock instructions and recovery codes to this address only.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-sm text-stone-600 dark:text-stone-300 block" htmlFor="context">Optional Context (Last known location, etc.)</label>
              <textarea
                className="block w-full px-4 py-3 bg-[#faf2ea] dark:bg-stone-950 border-transparent rounded-xl focus:ring-2 focus:ring-[#48a9a6] focus:border-[#48a9a6] focus:bg-white dark:focus:bg-stone-800 text-[#1e1b17] dark:text-stone-100 placeholder:text-stone-400 dark:placeholder-stone-500 transition-all min-h-[100px] resize-none outline-none"
                id="context"
                placeholder="Provide any details that might assist in recovery..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row md:justify-end gap-3">
          <Link
            href="/"
            className="px-8 py-3 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-semibold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-center"
          >
            Cancel Protocol
          </Link>
          <button
            className="px-8 py-3 bg-[#ba1a1a] hover:bg-[#93000a] dark:bg-[#ffb4ab] dark:hover:bg-[#ffdad6] text-white dark:text-[#690005] font-semibold rounded-xl shadow-lg shadow-[#ba1a1a]/20 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            type="button"
            onClick={handleReport}
            disabled={imei.length !== 15 || loading}
          >
            <span className="material-symbols-outlined text-[20px]">gpp_bad</span>
            {loading ? 'Processing...' : 'Confirm Stolen Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
