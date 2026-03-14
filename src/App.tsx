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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="animate-spin text-white" size={32} strokeWidth={1} />
          <p className="text-white font-light tracking-[0.2em] uppercase text-xs animate-pulse">EagleFinance</p>
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
        <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50/50">
          {/* Mobile Header */}
          <header className="lg:hidden bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-30">
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('toggle-sidebar'));
              }}
              className="p-2 text-slate-600"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white">
                <BarChart3 size={16} />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">EagleFinance</span>
            </div>
            <div className="w-10" />
          </header>

          <Sidebar 
            activeSection={activeSection} 
            setActiveSection={setActiveSection} 
            onLogout={handleLogout}
            user={user}
          />
          
          <main className="flex-1 lg:ml-24 transition-all duration-500 p-4 md:p-8 lg:p-12 min-h-screen">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}
