import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  Wallet, 
  Calendar, 
  FileText,
  Activity,
  Settings,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Colaboradores', path: '/employees', icon: Users },
    { name: 'Exames Médicos', path: '/exams', icon: Stethoscope },
    { name: 'Empréstimos', path: '/loans', icon: Wallet },
    { name: 'Férias', path: '/vacations', icon: Calendar },
    { name: 'Relatórios', path: '/reports', icon: FileText },
    { name: 'Turnover', path: '/turnover', icon: Activity },
    { name: 'Configurações', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('rhflow_token');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col shadow-xl z-10">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700/50">
        <div className="bg-[#10b981] p-2 rounded-lg">
          <Users size={20} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">Gestão RH</h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={twMerge(
                clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  "hover:bg-slate-800 hover:text-white group",
                  isActive ? "bg-slate-800 text-[#10b981] font-medium" : ""
                )
              )}
            >
              <item.icon 
                size={20} 
                className={isActive ? "text-[#10b981]" : "text-slate-400 group-hover:text-white"} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50 mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition-all duration-200 text-slate-400 hover:bg-red-500/10 hover:text-red-400 group"
        >
          <LogOut size={20} className="text-slate-500 group-hover:text-red-400 transition-colors" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
