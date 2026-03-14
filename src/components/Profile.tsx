import React, { useState } from 'react';
import { 
  User as UserIcon, Mail, Shield, LogOut, 
  Camera, Loader2, CheckCircle2, AlertCircle,
  Key, Bell, Smartphone
} from 'lucide-react';
import { auth } from '../firebase';
import { updateProfile, updatePassword, signOut } from 'firebase/auth';
import { useToast } from './Toast';
import { cn } from '../lib/utils';
import { User as FirebaseUser } from 'firebase/auth';

interface ProfileProps {
  user: FirebaseUser;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { showToast } = useToast();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile(user, { displayName });
      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao atualizar perfil.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await updatePassword(user, newPassword);
      showToast('Senha atualizada com sucesso!', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      showToast('Erro ao atualizar senha. Tente fazer login novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meu Perfil</h1>
          <p className="text-slate-500 mt-1 font-medium">Gerencie suas informações pessoais e segurança.</p>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="btn-secondary text-rose-600 hover:bg-rose-50 border-rose-100 flex items-center gap-2"
        >
          <LogOut size={18} />
          Sair da Conta
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="modern-card text-center py-10">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full bg-accent-soft flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={48} className="text-accent" />
                )}
              </div>
              <button className="absolute bottom-1 right-1 p-2 bg-accent text-white rounded-full shadow-lg hover:scale-110 transition-all">
                <Camera size={16} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{user.displayName || 'Usuário'}</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">{user.email}</p>
            
            <div className="mt-8 pt-8 border-t border-slate-50 flex justify-center gap-4">
              <div className="text-center px-4">
                <p className="text-lg font-bold text-slate-900">12</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meses</p>
              </div>
              <div className="w-px h-8 bg-slate-100 self-center" />
              <div className="text-center px-4">
                <p className="text-lg font-bold text-slate-900">156</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registros</p>
              </div>
            </div>
          </div>

          <div className="modern-card space-y-4">
            <h3 className="stat-label mb-4">Status da Conta</h3>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <CheckCircle2 size={18} className="text-emerald-500" />
              E-mail verificado
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <Shield size={18} className="text-accent" />
              Proteção ativa
            </div>
          </div>
        </div>

        {/* Main Forms */}
        <div className="lg:col-span-2 space-y-8">
          <div className="modern-card">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-accent-soft text-accent rounded-lg">
                <UserIcon size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Informações Pessoais</h3>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="stat-label">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      className="input-field pl-12"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="stat-label">E-mail (Não alterável)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="email" 
                      disabled
                      className="input-field pl-12 bg-slate-50 text-slate-400 cursor-not-allowed"
                      value={user.email || ''}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-primary min-w-[160px] flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>

          <div className="modern-card">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Key size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Segurança e Senha</h3>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="stat-label">Nova Senha</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="input-field"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="stat-label">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="input-field"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-primary min-w-[160px] flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>

          <div className="modern-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Bell size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Preferências</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-900">Notificações por E-mail</p>
                  <p className="text-xs text-slate-500">Receba resumos semanais de seus gastos.</p>
                </div>
                <div className="w-12 h-6 bg-accent rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Modo Escuro (Em breve)</p>
                  <p className="text-xs text-slate-500">Alterne entre temas claro e escuro.</p>
                </div>
                <div className="w-12 h-6 bg-slate-200 rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
