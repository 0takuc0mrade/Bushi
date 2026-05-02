'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', href: '/' },
  { label: 'Register Device', icon: 'add_to_home_screen', href: '/register' },
  { label: 'Security', icon: 'gpp_maybe', href: '/report' },
  { label: 'Vendor Portal', icon: 'verified_user', href: '/verify' },
  { label: 'Global Explorer', icon: 'public', href: '/explorer' },
  { label: 'Settings', icon: 'settings', href: '#' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = usePrivy();

  return (
    <aside className="hidden md:flex bg-stone-50 dark:bg-stone-900 h-screen w-64 border-r border-stone-200 dark:border-stone-800 flex-col fixed left-0 top-0 p-4 z-50 transition-colors">
      {/* Logo */}
      <div className="mb-8 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#48A9A6] flex items-center justify-center text-white font-bold text-lg shrink-0">
            B
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#48A9A6] dark:text-[#5BC4C1]">Bushi</h1>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Secure Fintech</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Report Stolen Button */}
      <Link
        href="/report"
        className="mb-8 w-full bg-[#ba1a1a] text-white text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#ba1a1a]/90 transition-colors active:scale-95"
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
        Report Stolen
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                isActive
                  ? 'bg-[#48A9A6]/10 text-[#48A9A6] dark:text-[#5BC4C1]'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Links */}
      <div className="mt-auto pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-1">
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-sm font-semibold transition-colors active:scale-95">
          <span className="material-symbols-outlined text-[22px]">help_outline</span>
          <span>Support</span>
        </a>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-sm font-semibold transition-colors active:scale-95 w-full text-left"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
