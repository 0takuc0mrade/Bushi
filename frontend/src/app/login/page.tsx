'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Login() {
  const { login, ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  return (
    <div className="bg-[#fff8f1] dark:bg-stone-950 min-h-screen flex items-center justify-center overflow-x-hidden selection:bg-[#48a9a6]/30 transition-colors">
      {/* Background decorations */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#48a9a6]/5 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#d98661]/5 rounded-full blur-[100px]"></div>
      </div>

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="md:hidden flex flex-col items-center justify-between min-h-screen w-full">
        <header className="w-full max-w-screen-xl mx-auto px-6 py-12 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[#48a9a6] dark:text-[#5BC4C1] text-4xl">shield</span>
            <h1 className="text-[#48a9a6] dark:text-[#5BC4C1] text-3xl font-bold tracking-tight">Bushi</h1>
          </div>
          <p className="text-[#5e5e5c] dark:text-stone-400 max-w-xs leading-relaxed">
            Bank-grade encryption for your physical devices.
          </p>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center w-full max-w-md px-6 text-center">
          <div className="relative w-full aspect-square max-w-[320px] mb-10">
            <div className="absolute inset-0 bg-[#48a9a6]/10 blur-3xl rounded-full scale-110"></div>
            <div className="relative bg-white dark:bg-stone-900 rounded-[40px] shadow-xl shadow-[#5e5e5c]/5 dark:shadow-none p-8 flex flex-col items-center justify-center overflow-hidden h-full border border-[#f4ede5] dark:border-stone-800">
              <span className="material-symbols-outlined text-[120px] text-[#48A9A6] dark:text-[#5BC4C1]">shield</span>
            </div>
          </div>
          <div className="space-y-3 mb-16">
            <h2 className="text-[#1e1b17] dark:text-stone-100 text-2xl font-semibold">Welcome to Peace of Mind</h2>
            <p className="text-[#5e5e5c] dark:text-stone-400">Secure your most important items with technology that works for you, not against you.</p>
          </div>
        </main>

        <footer className="w-full max-w-md px-6 pb-12 space-y-4">
          <button
            onClick={login}
            disabled={!ready}
            className="w-full h-[56px] flex items-center justify-center bg-[#48a9a6] text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-md shadow-[#48a9a6]/20 disabled:opacity-50"
          >
            {ready ? 'Get Started securely with Privy' : 'Loading...'}
          </button>
          <div className="pt-4 text-center">
            <p className="text-[#5e5e5c] dark:text-stone-400 text-xs leading-relaxed font-semibold">
              By continuing, you agree to our <a className="text-[#48a9a6] dark:text-[#5BC4C1] hover:underline" href="#">Terms of Service</a> and <a className="text-[#48a9a6] dark:text-[#5BC4C1] hover:underline" href="#">Privacy Policy</a>.
            </p>
          </div>
        </footer>
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden md:flex items-center justify-center w-full">
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl shadow-stone-200/50 dark:shadow-none border border-[#f4ede5] dark:border-stone-800 p-10 w-full max-w-md text-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-full bg-[#48A9A6]/10 dark:bg-[#5BC4C1]/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-[#48A9A6] dark:text-[#5BC4C1]">B</span>
          </div>

          <h1 className="text-2xl font-bold text-[#1e1b17] dark:text-stone-100 mb-2">Welcome to Bushi</h1>
          <p className="text-stone-500 dark:text-stone-400 mb-8">Bank-grade encryption for your<br />physical devices.</p>

          {/* Google Button */}
          <button
            onClick={login}
            disabled={!ready}
            className="w-full h-[52px] flex items-center justify-center gap-3 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[#1e1b17] dark:text-stone-200 font-semibold text-sm rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-all active:scale-[0.98] mb-4 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800"></div>
            <span className="text-xs text-stone-400 dark:text-stone-500">or</span>
            <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800"></div>
          </div>

          {/* Email Button */}
          <button
            onClick={login}
            disabled={!ready}
            className="w-full h-[52px] flex items-center justify-center gap-2 bg-[#006a68] text-white font-semibold text-sm rounded-xl hover:bg-[#00504e] transition-all active:scale-[0.98] shadow-md shadow-[#006a68]/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">mail</span>
            Continue with Email
          </button>

          {/* Terms */}
          <p className="text-stone-400 dark:text-stone-500 text-xs mt-6 leading-relaxed">
            By continuing, you agree to Bushi&apos;s <a className="text-[#48a9a6] dark:text-[#5BC4C1] hover:underline" href="#">Terms of Service</a> and <a className="text-[#48a9a6] dark:text-[#5BC4C1] hover:underline" href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
