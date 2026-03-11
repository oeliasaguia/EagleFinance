import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Bell, Moon, Sun, Camera, Save, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';

import { User as FirebaseUser } from 'firebase/auth';

interface ProfileProps {
  user: FirebaseUser;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [currency, setCurrency] = useState('BRL');
  const [language, setLanguage] = useState('pt-BR');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrency(data.currency || 'BRL');
          setLanguage(data.language || 'pt-BR');
          setTheme(data.theme || 'light');
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };
    fetchPrefs();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }

      // Update Firestore Prefs
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        email: user.email,
        currency,
        language,
        theme,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setSaving(false);
    }
  };

  const userInitials = displayName 
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || '??';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-brand-dark">Perfil</h1>
        <p className="text-gray-500">Gerencie suas informações e preferências.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-8 flex flex-col items-center text-center gap-4">
            <div className="relative group">
              {user.photoURL ? (
                <img src={user.photoURL} alt={displayName || ''} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-brand-dark flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                  {userInitials}
                </div>
              )}
              <button className="absolute bottom-0 right-0 p-2 bg-brand-gold text-brand-dark rounded-full shadow-lg hover:scale-110 transition-all">
                <Camera size={18} />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-xl text-brand-dark">{displayName || 'Usuário'}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <span className="px-4 py-1 bg-brand-gold/10 text-brand-gold rounded-full text-xs font-bold uppercase tracking-wider">
              Plano Gratuito
            </span>
          </div>

          <div className="glass-card p-4 space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-brand-dark text-white font-medium">
              <User size={18} />
              Dados Pessoais
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-all">
              <Shield size={18} />
              Segurança
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-all">
              <Bell size={18} />
              Notificações
            </button>
          </div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Nome Completo</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">E-mail</label>
                <input type="email" className="input-field" value={user.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Moeda Padrão</label>
                <select 
                  className="input-field"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                >
                  <option value="BRL">Real (BRL)</option>
                  <option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Idioma</label>
                <select 
                  className="input-field"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en-US">English (US)</option>
                </select>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-4">
              <h4 className="font-bold text-brand-dark">Preferências de Tema</h4>
              <div className="flex gap-4">
                <button 
                  onClick={() => setTheme('light')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all",
                    theme === 'light' ? "border-brand-gold bg-brand-gold/5 text-brand-gold" : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <Sun size={20} />
                  <span className="font-bold">Claro</span>
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all",
                    theme === 'dark' ? "border-brand-gold bg-brand-gold/5 text-brand-gold" : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <Moon size={20} />
                  <span className="font-bold">Escuro</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 px-8 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
