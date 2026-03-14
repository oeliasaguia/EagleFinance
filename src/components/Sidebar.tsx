import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CalendarClock, 
  CreditCard, 
  User, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';

import { User as FirebaseUser } from 'firebase/auth';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onLogout: () => void;
  user: FirebaseUser;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection, onLogout, user }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsOpen(true);
    }

    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'income', icon: ArrowUpCircle, label: 'Receitas' },
    { id: 'expenses', icon: ArrowDownCircle, label: 'Despesas' },
    { id: 'fixed', icon: CalendarClock, label: 'Despesas Fixas' },
    { id: 'cards', icon: CreditCard, label: 'Cartões' },
    { id: 'categories', icon: BarChart3, label: 'Categorias' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  const handleSectionSelect = (id: string) => {
    setActiveSection(id);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const userInitials = user.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || '??';

  return (
    <>
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-white transition-all duration-500 z-50 flex flex-col border-r border-slate-100 shadow-xl shadow-slate-200/20",
        isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 lg:w-24"
      )}>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
            <BarChart3 size={20} />
          </div>
          {isOpen && (
            <span className="font-bold text-xl text-slate-900 tracking-tight animate-in fade-in slide-in-from-left-2">
              Eagle<span className="text-accent">Finance</span>
            </span>
          )}
        </div>

        <nav className="flex-1 px-4 mt-10 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionSelect(item.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group relative",
                activeSection === item.id 
                  ? "bg-accent-soft text-accent" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={20} strokeWidth={activeSection === item.id ? 2.5 : 2} className="shrink-0" />
              {isOpen && (
                <span className="text-sm font-semibold animate-in fade-in slide-in-from-left-2">
                  {item.label}
                </span>
              )}
              {activeSection === item.id && !isOpen && (
                <div className="absolute right-0 w-1 h-6 bg-accent rounded-l-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-50">
          <div className={cn(
            "flex items-center gap-4 p-3 rounded-2xl bg-slate-50 transition-all",
            !isOpen && "justify-center bg-transparent"
          )}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-xl shadow-sm object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-sm font-bold shrink-0">
                {userInitials}
              </div>
            )}
            {isOpen && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-500">
                <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || 'Usuário'}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-4 p-4 mt-4 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group",
              !isOpen && "justify-center"
            )}
          >
            <LogOut size={20} strokeWidth={2} />
            {isOpen && <span className="text-sm font-semibold">Sair da Conta</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
