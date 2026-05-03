'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { getBushiProgram, buildRegisterDeviceTx, fetchDeviceByImei } from '@/lib/bushiClient';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const [imei, setImei] = useState('');
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

  const handleRegister = async () => {
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

      // Check if device is already registered
      const deviceCheck = await fetchDeviceByImei(program, imei);
      if (deviceCheck.exists) {
        alert('This device (IMEI) is already registered on VaultID.');
        setLoading(false);
        return;
      }

      const { transaction } = await buildRegisterDeviceTx(program, connection, imei, pubkey);
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
      console.log('Registration successful:', txSig);
      router.push('/');
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Failed to register device. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== MOBILE HEADER ===== */}
      <header className="md:hidden bg-[#FDFCFB] dark:bg-stone-900 shadow-sm dark:shadow-none border-b border-transparent dark:border-stone-800 sticky top-0 z-50 transition-colors">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1]">arrow_back</span>
            </Link>
            <h1 className="font-semibold tracking-tight text-[#1e1b17] dark:text-stone-100">Register Device</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="text-xl font-bold text-[#48A9A6] dark:text-[#5BC4C1]">VaultID</div>
          </div>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <div className="flex-grow px-6 md:px-10 lg:px-16 py-6 md:py-10 max-w-5xl mx-auto w-full">
        {/* Desktop Page Header */}
        <div className="hidden md:block mb-8">
          <h1 className="text-[32px] font-bold text-[#1e1b17] dark:text-stone-100 mb-2">Secure Your Device</h1>
          <p className="text-stone-500 dark:text-stone-400 text-lg">Register your device&apos;s unique IMEI number to enable advanced security features and remote tracking.</p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-[#e8e1d9] dark:border-stone-800 overflow-hidden transition-colors">
          {/* Desktop Stepper */}
          <div className="hidden md:flex items-center justify-between px-10 py-6 border-b border-[#e8e1d9] dark:border-stone-800">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#48A9A6] text-white flex items-center justify-center text-sm font-semibold">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <span className="text-sm font-semibold text-stone-500 dark:text-stone-400">Identity</span>
            </div>
            <div className="flex-1 h-px bg-[#e8e1d9] dark:bg-stone-800 mx-6"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#48A9A6] text-white flex items-center justify-center text-sm font-semibold">2</div>
              <span className="text-sm font-semibold text-[#48A9A6] dark:text-[#5BC4C1]">Device Info</span>
            </div>
            <div className="flex-1 h-px bg-[#e8e1d9] dark:bg-stone-800 mx-6"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#e8e1d9] dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center text-sm font-semibold">3</div>
              <span className="text-sm font-semibold text-stone-400 dark:text-stone-500">Confirm</span>
            </div>
          </div>

          {/* Content Grid: Form + Helper */}
          <div className="p-6 md:p-10 md:grid md:grid-cols-5 md:gap-10">
            {/* Left: Form */}
            <div className="md:col-span-3 space-y-6">
              {/* Mobile image */}
              <div className="md:hidden w-full mb-6 text-center">
                <div className="relative w-48 h-48 mx-auto mb-4">
                  <div className="absolute inset-0 bg-[#94f2ef]/20 rounded-full blur-2xl"></div>
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[80px] text-[#48A9A6]">smartphone</span>
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-[#1e1b17] mb-1">Protect Your Device</h2>
                <p className="text-stone-500 px-4">Secure your assets by linking your physical hardware to your VaultID account.</p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-sm text-stone-600 dark:text-stone-300 block" htmlFor="imei">15-Digit IMEI Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-stone-400 dark:text-stone-500 group-focus-within:text-[#006a68] dark:group-focus-within:text-[#5BC4C1] transition-colors">lock</span>
                  </div>
                  <input
                    className="block w-full pl-12 pr-4 py-4 bg-[#faf2ea] dark:bg-stone-950 border-transparent rounded-xl focus:ring-2 focus:ring-[#48a9a6] focus:border-[#48a9a6] focus:bg-white dark:focus:bg-stone-800 text-[#1e1b17] dark:text-stone-100 text-xl md:text-2xl tracking-widest placeholder:tracking-normal placeholder:text-stone-400 dark:placeholder-stone-500 transition-all outline-none"
                    id="imei"
                    maxLength={15}
                    name="imei"
                    placeholder="e.g. 359123456789012"
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
                <p className="text-xs text-stone-400 mt-1">Your IMEI is securely encrypted and never shared with third parties.</p>
              </div>

              <button
                className="w-full bg-[#48A9A6] hover:bg-[#3a8a87] text-white font-semibold text-lg py-4 rounded-xl shadow-lg shadow-[#48A9A6]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                type="button"
                onClick={handleRegister}
                disabled={imei.length !== 15 || loading}
              >
                <span className="material-symbols-outlined">verified_user</span>
                {loading ? 'Securing...' : 'Secure My Device'}
              </button>
            </div>

            {/* Right: Helper Card (Desktop only) */}
            <div className="hidden md:flex md:col-span-2 bg-[#faf2ea] dark:bg-stone-950 rounded-xl border border-[#e8e1d9] dark:border-stone-800 p-6 flex-col items-center text-center gap-4 transition-colors">
              <div className="w-16 h-16 rounded-full bg-[#48A9A6]/10 dark:bg-[#5BC4C1]/10 flex items-center justify-center text-[#48A9A6] dark:text-[#5BC4C1]">
                <span className="material-symbols-outlined text-[36px]">dialpad</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1e1b17] dark:text-stone-100">How to find it</h3>
              <p className="text-stone-500 dark:text-stone-400">Open your phone&apos;s dialer pad and enter the following code:</p>
              <div className="bg-[#e8e1d9] dark:bg-stone-800 rounded-xl px-8 py-4 text-2xl font-bold tracking-widest text-[#1e1b17] dark:text-stone-100">
                *#06#
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Helper */}
        <div className="md:hidden bg-[#48a9a6]/10 dark:bg-[#5BC4C1]/10 border border-[#48a9a6]/20 dark:border-[#5BC4C1]/20 rounded-xl p-4 flex items-start gap-4 mt-6 transition-colors">
          <div className="bg-[#48a9a6] text-white rounded-lg p-2 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-[#003938] dark:text-[#5BC4C1] mb-1">How to find your IMEI?</p>
            <p className="text-[13px] leading-relaxed text-[#003938]/80 dark:text-stone-300">
              Open your phone&apos;s keypad and dial <span className="font-bold text-[#006a68] dark:text-[#5BC4C1]">*#06#</span> to display your unique device identifier instantly.
            </p>
          </div>
        </div>

        {/* Desktop Info Banner */}
        <div className="hidden md:flex items-start gap-4 bg-[#faf2ea] dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 p-6 mt-8 transition-colors">
          <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1] shrink-0">info</span>
          <p className="text-stone-600 dark:text-stone-400">
            Registering your device binds it to your VaultID account. If lost or stolen, you can instantly lock access to your financial data from any web browser.
          </p>
        </div>

        {/* Mobile Security Footer */}
        <div className="md:hidden mt-6 px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#006a68] dark:text-[#5BC4C1] text-[18px]">security</span>
            <span className="font-semibold text-sm text-[#006a68]">Bank-Grade Encryption</span>
          </div>
          <p className="text-[12px] text-stone-500 leading-relaxed">
            Your IMEI is hashed and encrypted for your security. VaultID never stores plain-text hardware identifiers.
          </p>
        </div>
      </div>
    </div>
  );
}
