'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Pages that should NOT have the Sidebar and TopBar
  const noNavPages = ['/login', '/verify'];
  const showNav = !noNavPages.includes(pathname);

  if (!showNav) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      {/* Desktop: Sidebar + TopBar + Content */}
      <Sidebar />
      <div className="flex flex-col min-h-screen md:ml-64">
        <TopBar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
