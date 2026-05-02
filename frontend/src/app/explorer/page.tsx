'use client';

import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Connection } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { getBushiProgram, fetchAllDevices } from '@/lib/bushiClient';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';

export default function Explorer() {
  const { ready } = usePrivy();
  const { wallets } = useWallets();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDevices() {
      if (!ready) return;

      try {
        const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');
        const dummyWallet = {
          publicKey: wallets[0]?.address ? new (window as any).solanaWeb3.PublicKey(wallets[0].address) : null,
          signTransaction: async () => { throw new Error("Read only"); },
          signAllTransactions: async () => { throw new Error("Read only"); },
        };
        const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
        const program = getBushiProgram(provider);

        // Fetch all secured devices
        const allDevices = await fetchAllDevices(program);
        setDevices(allDevices);
      } catch (error) {
        console.error("Failed to load global devices:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDevices();
  }, [ready, wallets]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFCFB] dark:bg-[#121212]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#48A9A6]"></div>
      </div>
    );
  }

  // Format truncations
  const truncate = (str: string) => {
    if (!str) return '';
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[#FDFCFB] dark:bg-[#121212] transition-colors pb-24 md:pb-8">
        
        {/* ===== MOBILE HEADER ===== */}
        <header className="md:hidden bg-[#FDFCFB] dark:bg-[#121212] shadow-sm dark:shadow-none border-b border-transparent dark:border-stone-800 sticky top-0 z-50 transition-colors">
          <div className="flex justify-between items-center w-full px-6 py-4">
            <h1 className="font-semibold tracking-tight text-[#1e1b17] dark:text-stone-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1]">public</span>
              Global Explorer
            </h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="text-xl font-bold text-[#48A9A6] dark:text-[#5BC4C1]">Bushi</div>
            </div>
          </div>
        </header>

        {/* ===== CONTENT ===== */}
        <div className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full max-w-7xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-2">Network Activity</h1>
            <p className="text-gray-500 dark:text-stone-400">Live view of all devices cryptographically secured by Bushi.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#48A9A6] mb-4"></div>
              <p className="text-gray-500 dark:text-stone-400 text-sm">Scanning blockchain...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-10 text-center border border-gray-100 dark:border-stone-800 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-stone-500">
                <span className="material-symbols-outlined text-3xl">public_off</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-stone-200 mb-2">No Devices Found</h3>
              <p className="text-gray-500 dark:text-stone-400 max-w-sm mx-auto">
                No devices have been registered on the network yet.
              </p>
            </div>
          ) : (
            <>
              {/* ===== DESKTOP TABLE ===== */}
              <div className="hidden md:block bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-gray-100 dark:border-stone-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-stone-800/50 text-xs font-semibold text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                      <th className="px-6 py-4 border-b border-gray-100 dark:border-stone-800">Asset</th>
                      <th className="px-6 py-4 border-b border-gray-100 dark:border-stone-800">Bushi ID (Hash)</th>
                      <th className="px-6 py-4 border-b border-gray-100 dark:border-stone-800">Owner</th>
                      <th className="px-6 py-4 border-b border-gray-100 dark:border-stone-800">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-stone-800">
                    {devices.map((device, idx) => (
                      <tr key={idx} className={`hover:bg-gray-50/50 dark:hover:bg-stone-800/50 transition-colors ${device.account.isStolen ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${device.account.isStolen ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-400'}`}>
                              <span className="material-symbols-outlined text-lg">smartphone</span>
                            </div>
                            <span className={`font-semibold ${device.account.isStolen ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-stone-200'}`}>
                              Secured Device
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-stone-400">
                          {device.account.assetId?.toBase58() ? truncate(device.account.assetId.toBase58()) : 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#48A9A6]/20 flex items-center justify-center shrink-0 text-[10px]">👤</span>
                            <span className="text-sm font-mono text-gray-600 dark:text-stone-300">
                              {truncate(device.account.owner.toBase58())}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`${device.account.isStolen ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/50' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30'} inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold`}>
                            {device.account.isStolen ? (
                              <><span className="material-symbols-outlined text-[14px]">warning</span> Stolen</>
                            ) : (
                              <><span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400"></span> Active</>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ===== MOBILE CARDS ===== */}
              <div className="md:hidden flex flex-col gap-4">
                {devices.map((device, idx) => (
                  <div key={idx} className={`bg-white dark:bg-stone-900 rounded-xl p-5 shadow-sm flex flex-col gap-4 border ${device.account.isStolen ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20' : 'border-gray-100 dark:border-stone-800'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${device.account.isStolen ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-400'}`}>
                          <span className="material-symbols-outlined text-xl">smartphone</span>
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-semibold ${device.account.isStolen ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-stone-200'}`}>Secured Device</span>
                          <span className="text-xs text-gray-500 dark:text-stone-400 font-mono">
                            ID: {device.account.assetId?.toBase58() ? truncate(device.account.assetId.toBase58()) : 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className={`${device.account.isStolen ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'} px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                        {device.account.isStolen ? (
                          <><span className="material-symbols-outlined text-[12px]">warning</span> Stolen</>
                        ) : (
                          <><span className="w-1.5 h-1.5 rounded-full bg-green-700 dark:bg-green-400"></span> Active</>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-stone-800/50 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold">Owner</span>
                      <span className="text-sm font-mono text-gray-700 dark:text-stone-300">
                        {truncate(device.account.owner.toBase58())}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== MOBILE BOTTOM NAV (hidden on desktop) ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-8 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-t-3xl border-t border-stone-100 dark:border-stone-800 shadow-sm text-xs font-medium">
        <Link className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-[#48A9A6] dark:hover:text-[#5BC4C1] transition-all" href="/">
          <span className="material-symbols-outlined mb-1">home</span>
          <span>Home</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-[#48A9A6] dark:hover:text-[#5BC4C1] transition-all" href="/verify">
          <span className="material-symbols-outlined mb-1">devices</span>
          <span>Verify</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-[#48A9A6] dark:text-[#5BC4C1] bg-[#48A9A6]/10 dark:bg-[#5BC4C1]/10 rounded-xl px-4 py-1" href="/explorer">
          <span className="material-symbols-outlined mb-1">public</span>
          <span>Explorer</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-[#48A9A6] dark:hover:text-[#5BC4C1] transition-all" href="#">
          <span className="material-symbols-outlined mb-1">contact_support</span>
          <span>Support</span>
        </Link>
      </nav>
    </>
  );
}
