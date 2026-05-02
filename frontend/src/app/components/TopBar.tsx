'use client';

export default function TopBar() {
  return (
    <header className="hidden md:flex bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-md w-full h-16 sticky top-0 z-40 border-b border-stone-200 dark:border-stone-800 shadow-sm items-center justify-between px-8 transition-colors">
      <div className="flex items-center gap-4">
        {/* Breadcrumb / Page title area - can be customized per-page */}
      </div>
      <div className="flex items-center gap-6">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">search</span>
          <input
            className="bg-[#e8e1d9] dark:bg-stone-800 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#48A9A6]/50 text-[#1e1b17] dark:text-stone-200 w-64 placeholder-stone-500 dark:placeholder-stone-400 transition-all outline-none"
            placeholder="Search devices..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-stone-500 dark:text-stone-400 hover:text-[#48A9A6] dark:hover:text-[#5BC4C1] transition-colors rounded-full">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-stone-500 dark:text-stone-400 hover:text-[#48A9A6] dark:hover:text-[#5BC4C1] transition-colors rounded-full">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
}
