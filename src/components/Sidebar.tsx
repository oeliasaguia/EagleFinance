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
    // Set initial state based on screen size
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

  // Close sidebar on mobile when a section is selected
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
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-brand-dark text-white transition-all duration-300 z-50 flex flex-col shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"
      )}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 bg-brand-gold rounded-xl flex items-center justify-center text-brand-dark shrink-0">
            <BarChart3 size={24} />
          </div>
          {isOpen && (
            <span className="font-bold text-xl tracking-tight animate-in fade-in duration-500">EagleFinance</span>
          )}
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionSelect(item.id)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all group relative",
                activeSection === item.id 
                  ? "bg-brand-gold text-brand-dark font-bold shadow-lg shadow-brand-gold/20" 
                  : "hover:bg-white/10 text-gray-400 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn("shrink-0", activeSection === item.id ? "scale-110" : "group-hover:scale-110 transition-transform")} />
              {isOpen && (
                <span className="font-medium animate-in slide-in-from-left-2 duration-300">
                  {item.label}
                </span>
              )}
              {!isOpen && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-brand-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto space-y-4 border-t border-white/10">
          <div className={cn(
            "px-4 py-3 bg-white/5 rounded-2xl flex items-center gap-3 transition-all",
            !isOpen && "justify-center p-2"
          )}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-xl border border-white/10 object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center text-brand-dark font-bold shrink-0">
                {userInitials}
              </div>
            )}
            {isOpen && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-500">
                <p className="text-sm font-bold truncate">{user.displayName || 'Usuário'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all group",
              !isOpen && "justify-center"
            )}
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            {isOpen && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
