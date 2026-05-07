'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { getBushiProgram, fetchDevicesForOwner } from '@/lib/bushiClient';
import { useRouter } from 'next/navigation';
import ThemeToggle from './components/ThemeToggle';

export default function Home() {
  const { ready, authenticated, user, logout } = usePrivy();
  const router = useRouter();
  
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const solanaWalletAddress = useMemo(() => {
    if (!user?.linkedAccounts) return null;
    const solanaAccount = user.linkedAccounts.find(
      (account: any) => account.type === 'wallet' && account.chainType === 'solana'
    );
    return (solanaAccount as any)?.address ?? null;
  }, [user]);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/login');
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    async function loadDevices() {
      if (solanaWalletAddress) {
        try {
          const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
          const pubkey = new PublicKey(solanaWalletAddress);
          const walletAdapter = {
            publicKey: pubkey,
            signTransaction: async (tx: any) => tx,
            signAllTransactions: async (txs: any) => txs,
          };
          const provider = new AnchorProvider(connection, walletAdapter as any, { commitment: 'confirmed' });
          const program = getBushiProgram(provider);
          const userDevices = await fetchDevicesForOwner(program, pubkey);
          setDevices(userDevices);
        } catch (error) {
          console.error("Failed to load devices", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    if (authenticated) {
      loadDevices();
    }
  }, [solanaWalletAddress, authenticated]);

  if (!ready || !authenticated) {
    return null;
  }

  const getBushiId = (device: any) => {
    const hash = device.account.hashedImei;
    const hex = Array.from(hash.slice(0, 4) as number[]).map((b: number) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    return `BSH-••••-${hex.slice(0, 4)}`;
  };

  return (
    <>
      {/* ===== MOBILE HEADER (hidden on desktop) ===== */}
      <header className="md:hidden fixed top-0 w-full z-40 bg-[#FDFCFB] dark:bg-stone-900 shadow-sm dark:shadow-none border-b border-transparent dark:border-stone-800 flex justify-between items-center px-6 h-16 transition-colors">
        <div className="flex items-center gap-4 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer rounded-full p-2 -ml-2">
          <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1]">menu</span>
        </div>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="VaultID" width={28} height={28} className="rounded-full" />
          <span className="text-xl font-bold tracking-tight text-[#48A9A6] dark:text-[#5BC4C1]">VaultID</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="flex items-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer rounded-full p-1 -mr-1" onClick={logout}>
            <span className="material-symbols-outlined text-stone-500 dark:text-stone-400">account_circle</span>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="pt-16 md:pt-0 pb-24 md:pb-8 px-6 md:px-10 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Welcome Section */}
        <section className="w-full mb-8 md:mb-10 text-center md:text-left pt-6 md:pt-10">
          <h1 className="text-3xl md:text-[32px] font-bold text-[#1e1b17] dark:text-stone-100 mb-1">Welcome back.</h1>
          <p className="text-stone-500 dark:text-stone-400 md:text-lg">Here is a quick overview of your secure environment.</p>
          {solanaWalletAddress ? (
            <p className="text-xs text-stone-400 mt-2 flex items-center gap-1 cursor-pointer group justify-center md:justify-start"
               onClick={() => { navigator.clipboard.writeText(solanaWalletAddress); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              Wallet: {solanaWalletAddress.slice(0,4)}...{solanaWalletAddress.slice(-4)}
              <span className="material-symbols-outlined text-sm text-stone-300 group-hover:text-[#48A9A6] transition-colors">content_copy</span>
              {copied && <span className="text-[#48A9A6] text-[10px] font-semibold animate-pulse">Copied!</span>}
            </p>
          ) : (
            <p className="text-xs text-stone-400 mt-2">Wallet: Loading embedded wallet...</p>
          )}
        </section>

        {/* ===== ACTION CARDS ===== */}
        <section className="w-full grid grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
          {/* Mobile Action Cards */}
          <Link href="/register" className="md:hidden flex flex-col items-center justify-center bg-[#48a9a6] text-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 group">
            <div className="bg-[#003938] text-[#48a9a6] rounded-full p-3 mb-3 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">add</span>
            </div>
            <span className="font-semibold text-center text-sm">Register<br />Device</span>
          </Link>
          <Link href="/report" className="md:hidden flex flex-col items-center justify-center bg-white dark:bg-stone-900 text-gray-800 dark:text-stone-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 group border border-gray-200 dark:border-stone-800">
            <div className="bg-[#ba1a1a] text-white rounded-full p-3 mb-3 group-hover:scale-110 transition-transform shadow-sm">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <span className="font-semibold text-center text-sm">Report<br />Stolen</span>
          </Link>

          {/* Desktop Action Cards */}
          <Link href="/register" className="hidden md:flex group bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-[#e8e1d9] dark:border-stone-800 hover:shadow-md transition-all duration-300 flex-col items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-[#48A9A6]/10 flex items-center justify-center text-[#48A9A6] group-hover:bg-[#48A9A6] group-hover:text-white transition-colors duration-300">
              <span className="material-symbols-outlined">add_to_home_screen</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#1e1b17] dark:text-stone-100 mb-1 group-hover:text-[#006a68] dark:group-hover:text-[#5BC4C1] transition-colors">Register Device</h3>
              <p className="text-stone-500 dark:text-stone-400">Add a new device to your secure VaultID network.</p>
            </div>
          </Link>
          <Link href="/report" className="hidden md:flex group bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-[#e8e1d9] dark:border-stone-800 hover:shadow-md transition-all duration-300 flex-col items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-[#ffdad6] dark:bg-[#ba1a1a]/20 text-[#93000a] dark:text-[#ffb4ab] flex items-center justify-center group-hover:bg-[#ba1a1a] group-hover:text-white transition-colors duration-300">
              <span className="material-symbols-outlined">gpp_bad</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#1e1b17] dark:text-stone-100 mb-1 group-hover:text-[#ba1a1a] dark:group-hover:text-[#ffb4ab] transition-colors">Report Stolen</h3>
              <p className="text-stone-500 dark:text-stone-400">Instantly freeze a device to prevent unauthorized access.</p>
            </div>
          </Link>
        </section>

        {/* ===== DEVICES SECTION ===== */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-semibold text-[#1e1b17] dark:text-stone-100">Protected Devices</h2>
            <button className="text-sm font-semibold text-[#006a68] dark:text-[#5BC4C1] hover:text-[#48A9A6] dark:hover:text-[#48A9A6] transition-colors flex items-center gap-1">
              View All
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center text-stone-500 py-8">Loading devices from Solana...</div>
          ) : devices.length === 0 ? (
            <div className="text-center text-stone-500 dark:text-stone-400 py-8 bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-stone-300 dark:text-stone-600 mb-2 block">devices</span>
              No devices registered yet. Register your first device to get started.
            </div>
          ) : (
            <>
              {/* ===== DESKTOP TABLE ===== */}
              <div className="hidden md:block bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-[#e8e1d9] dark:border-stone-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf2ea] dark:bg-stone-950/50 border-b border-[#e8e1d9] dark:border-stone-800">
                      <th className="py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Device Model</th>
                      <th className="py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">VaultID</th>
                      <th className="py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Status</th>
                      <th className="py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e1d9] dark:divide-stone-800">
                    {devices.map((device, idx) => (
                      <tr key={idx} className="hover:bg-[#faf2ea]/50 dark:hover:bg-stone-800/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-stone-400 dark:text-stone-500">smartphone</span>
                            <span className="font-semibold text-[#1e1b17] dark:text-stone-200">VaultID Device</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-stone-500 dark:text-stone-400 font-mono text-sm">{getBushiId(device)}</td>
                        <td className="py-4 px-6">
                          {device.account.isStolen ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCE8E6] dark:bg-[#ba1a1a]/20 text-[#C5221F] dark:text-[#ffb4ab] text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-[#C5221F] dark:bg-[#ffb4ab]"></span>Stolen
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] dark:bg-[#137333]/20 text-[#137333] dark:text-[#81c995] text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-[#137333] dark:bg-[#81c995]"></span>Active
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link href={`/device/${idx}`} className="p-2 text-stone-400 dark:text-stone-500 hover:text-[#1e1b17] dark:hover:text-stone-200 transition-colors rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 inline-flex">
                            <span className="material-symbols-outlined">more_vert</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ===== MOBILE CARDS ===== */}
              <div className="md:hidden flex flex-col gap-4">
                {devices.map((device, idx) => (
                  <Link key={idx} href={`/device/${idx}`} className={`bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm flex items-center justify-between border ${device.account.isStolen ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20' : 'border-gray-100 dark:border-stone-800'} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${device.account.isStolen ? 'bg-white/50 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-400'}`}>
                        <span className="material-symbols-outlined text-2xl">smartphone</span>
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-semibold ${device.account.isStolen ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-stone-200'}`}>VaultID Device</span>
                        <span className="text-sm text-gray-500 dark:text-stone-400">
                          {device.account.isStolen ? `Stolen • ${device.account.recoveryContact || 'No contact'}` : 'Active and protected'}
                        </span>
                      </div>
                    </div>
                    <div className={`${device.account.isStolen ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                      {device.account.isStolen ? (
                        <><span className="material-symbols-outlined text-sm">warning</span> Stolen</>
                      ) : (
                        <><span className="w-2 h-2 rounded-full bg-green-700 dark:bg-green-400"></span> Active</>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ===== MOBILE BOTTOM NAV (hidden on desktop) ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-8 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-t-3xl border-t border-stone-100 dark:border-stone-800 shadow-sm text-xs font-medium">
        <Link className="flex flex-col items-center justify-center text-[#48A9A6] dark:text-[#5BC4C1] bg-[#48A9A6]/10 dark:bg-[#5BC4C1]/10 rounded-xl px-4 py-1" href="/">
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
        <Link className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-[#48A9A6] dark:hover:text-[#5BC4C1] transition-all" href="/wallet">
          <span className="material-symbols-outlined mb-1">account_balance_wallet</span>
          <span>Vault</span>
        </Link>
      </nav>
    </>
  );
}
