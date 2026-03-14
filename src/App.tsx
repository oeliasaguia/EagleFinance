import React, { useState, useEffect, Component, ReactNode } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import FixedExpenses from './components/FixedExpenses';
import Cards from './components/Cards';
import Profile from './components/Profile';
import Categories from './components/Categories';
import Auth from './components/Auth';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { Loader2, BarChart3, Menu } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-gold" size={48} />
          <p className="text-white font-medium animate-pulse">Carregando EagleFinance...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'income': return <TransactionList type="income" user={user} />;
      case 'expenses': return <TransactionList type="expense" user={user} />;
      case 'fixed': return <FixedExpenses user={user} />;
      case 'cards': return <Cards user={user} />;
      case 'categories': return <Categories user={user} />;
      case 'profile': return <Profile user={user} />;
      default: return <Dashboard user={user} />;
    }
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="min-h-screen flex flex-col lg:flex-row bg-brand-gray">
          {/* Mobile Header */}
          <header className="lg:hidden bg-brand-dark text-white p-4 flex items-center gap-4 sticky top-0 z-30 shadow-md">
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('toggle-sidebar'));
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-brand-dark">
                <BarChart3 size={18} />
              </div>
              <span className="font-bold text-lg tracking-tight">EagleFinance</span>
            </div>
          </header>

          <Sidebar 
            activeSection={activeSection} 
            setActiveSection={setActiveSection} 
            onLogout={handleLogout}
            user={user}
          />
          
          <main className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-10 min-h-screen">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}
