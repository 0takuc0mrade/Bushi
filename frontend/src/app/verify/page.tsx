'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';

export default function VerifyDevice() {
  const [imei, setImei] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = async () => {
    if (imei.length !== 15) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/verify?imei=${imei}`);
      const data = await response.json();
      
      if (response.ok && data.exists) {
        setResult({
          exists: true,
          data: {
            isStolen: data.status === 'stolen',
            recoveryContact: data.recoveryContact,
            owner: { toBase58: () => data.owner }
          },
          pda: data.pda
        });
      } else {
        setResult({ exists: false, data: null, pda: null });
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setResult({ exists: false, data: null, pda: null });
    } finally {
      setLoading(false);
      setSearched(true);
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
            <h1 className="font-semibold tracking-tight text-[#1e1b17] dark:text-stone-100">Verify Device</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="text-xl font-bold text-[#48A9A6] dark:text-[#5BC4C1]">Bushi</div>
          </div>
        </div>
      </header>

      {/* ===== DESKTOP HEADER (for public page, replaces sidebar) ===== */}
      <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#48A9A6] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[18px]">verified_user</span>
          </div>
          <span className="text-xl font-bold text-[#48A9A6] dark:text-[#5BC4C1]">Bushi</span>
          <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 border border-stone-300 dark:border-stone-700 rounded-full px-3 py-1 ml-2">Public Verification Portal</span>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-semibold text-[#006a68] dark:text-[#5BC4C1] hover:text-[#48A9A6] dark:hover:text-[#48A9A6] transition-colors flex items-center gap-1">
            Vendor Login <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="flex-grow px-6 md:px-10 py-8 md:py-16 max-w-3xl mx-auto w-full">
        {/* Title */}
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-bold text-[#1e1b17] dark:text-stone-100 mb-2">Verify Device Integrity</h1>
          <p className="text-stone-500 dark:text-stone-400 md:text-lg max-w-xl mx-auto">
            Enter the device IMEI number below to instantly check its registration status and verify if it has been reported lost or stolen.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 shadow-sm p-2 mb-8 transition-colors">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">search</span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none focus:ring-0 text-lg text-[#1e1b17] dark:text-stone-100 placeholder:text-stone-400 dark:placeholder-stone-500 tracking-wide"
              placeholder="Enter 15-digit IMEI number"
              maxLength={15}
              type="text"
              value={imei}
              onChange={(e) => setImei(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={imei.length !== 15 || loading}
            className="bg-[#1e1b17] dark:bg-stone-200 text-white dark:text-stone-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#33302b] dark:hover:bg-stone-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Verify'}
          </button>
        </div>

        {/* Results */}
        {searched && result && (
          <>
            {result.exists ? (
              <>
                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 mb-6">
                  {/* Main Status */}
                  <div className={`md:col-span-3 rounded-xl p-6 relative overflow-hidden transition-colors ${
                    result.data.isStolen
                      ? 'bg-[#ffdad6] dark:bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 dark:border-[#ba1a1a]/30'
                      : 'bg-[#E6F4EA] dark:bg-[#137333]/10 border border-[#137333]/20 dark:border-[#137333]/30'
                  }`}>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 dark:opacity-5">
                      <span className="material-symbols-outlined text-[120px]">{result.data.isStolen ? 'warning' : 'verified'}</span>
                    </div>
                    <div className="relative z-10">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${
                        result.data.isStolen ? 'bg-[#ba1a1a] text-white' : 'bg-[#137333] text-white'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">{result.data.isStolen ? 'gpp_bad' : 'gpp_good'}</span>
                        STATUS: {result.data.isStolen ? 'STOLEN' : 'VERIFIED'}
                      </span>
                      <h2 className={`text-2xl font-bold mb-2 ${result.data.isStolen ? 'text-[#ba1a1a] dark:text-[#ffb4ab]' : 'text-[#137333] dark:text-[#81c995]'}`}>
                        {result.data.isStolen ? 'Device Flagged' : 'Device Verified'}
                      </h2>
                      <p className={`leading-relaxed ${result.data.isStolen ? 'text-[#93000a]/80 dark:text-[#ffb4ab]/80' : 'text-[#137333]/80 dark:text-[#81c995]/80'}`}>
                        {result.data.isStolen
                          ? 'This device has been reported stolen by its registered owner. Do not purchase or accept this device.'
                          : 'This device is registered and in good standing. No theft reports have been filed.'}
                      </p>
                      {result.data.isStolen && result.data.recoveryContact && (
                        <div className="mt-4 bg-white/60 dark:bg-stone-900/60 rounded-lg p-3 inline-block">
                          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Owner Recovery Contact</p>
                          <p className="flex items-center gap-2 text-[#1e1b17] dark:text-stone-200 font-semibold">
                            <span className="material-symbols-outlined text-[18px]">mail</span>
                            {result.data.recoveryContact}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bounty Card (if stolen) */}
                  {result.data.isStolen ? (
                    <div className="md:col-span-2 bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 p-6 flex flex-col items-center justify-center text-center gap-3 transition-colors">
                      <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1] text-[36px]">monetization_on</span>
                      <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Active Bounty</p>
                      <p className="text-4xl font-bold text-[#1e1b17] dark:text-stone-100">$50 <span className="text-lg font-normal text-stone-400">USDC</span></p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">Reward offered for information leading to recovery.</p>
                      <button className="mt-2 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-semibold px-6 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm">
                        Claim Details
                      </button>
                    </div>
                  ) : (
                    <div className="md:col-span-2 bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 p-6 flex flex-col items-center justify-center text-center gap-3 transition-colors">
                      <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1] text-[36px]">shield</span>
                      <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Blockchain Verified</p>
                      <p className="text-lg font-semibold text-[#1e1b17] dark:text-stone-100">Protected by Solana</p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">Device ownership is cryptographically proven on-chain.</p>
                    </div>
                  )}
                </div>

                {/* Detail Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 p-4 transition-colors">
                    <p className="text-xs font-semibold text-stone-400 uppercase mb-1">IMEI</p>
                    <p className="text-sm font-semibold text-[#1e1b17] dark:text-stone-200 font-mono">{imei}</p>
                  </div>
                  <div className="bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 p-4 transition-colors">
                    <p className="text-xs font-semibold text-stone-400 uppercase mb-1">Device Model</p>
                    <p className="text-sm font-semibold text-[#1e1b17] dark:text-stone-200">Bushi Device</p>
                  </div>
                  <div className="bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 p-4 transition-colors">
                    <p className="text-xs font-semibold text-stone-400 uppercase mb-1">Owner</p>
                    <p className="text-sm font-semibold text-[#1e1b17] dark:text-stone-200 font-mono truncate">{result.data.owner.toBase58().slice(0,8)}...</p>
                  </div>
                  <div className="bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 p-4 transition-colors">
                    <p className="text-xs font-semibold text-stone-400 uppercase mb-1">On-Chain PDA</p>
                    <p className="text-sm font-semibold text-[#006a68] dark:text-[#5BC4C1] font-mono truncate">{result.pda?.slice(0,8)}...</p>
                  </div>
                </div>
              </>
            ) : (
              /* Not Found */
              <div className="text-center bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 shadow-sm p-10 transition-colors">
                <span className="material-symbols-outlined text-5xl text-stone-300 dark:text-stone-600 mb-4 block">device_unknown</span>
                <h3 className="text-xl font-semibold text-[#1e1b17] dark:text-stone-100 mb-2">Device Not Found</h3>
                <p className="text-stone-500 dark:text-stone-400">This IMEI is not registered on the Bushi network. The device may not be protected yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
