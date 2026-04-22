import { Bell, Moon, Sun, Search, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl w-80 border border-transparent focus-within:border-[#10b981] focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
          <Search className="text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="bg-transparent border-none outline-none w-full text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors relative"
          title={isDark ? "Modo Claro" : "Modo Escuro"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors relative" title="Notificações">
          <Bell size={20} />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
        </button>
        
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
        
        <div className="flex items-center gap-3">
          <div className="bg-[#10b981]/10 p-1.5 rounded-lg">
            <UserCircle className="text-[#10b981]" size={20} />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
