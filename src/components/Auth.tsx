import React, { useState } from 'react';
import { Wallet, Mail, Lock, ArrowRight, User, Loader2, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

const Auth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Force account selection to avoid some silent failures
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-blocked') {
        setError('O popup foi bloqueado pelo navegador. Por favor, permita popups para este site.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('Este domínio não está autorizado no Firebase. Adicione este domínio na lista de domínios autorizados no Console do Firebase.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed the popup, don't show a big error
        return;
      } else {
        setError('Erro ao entrar com Google. Verifique se o domínio está autorizado no Firebase.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (error.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (error.code === 'auth/invalid-api-key') {
        setError('Configuração do Firebase pendente. Por favor, aguarde a configuração do sistema.');
      } else {
        setError('Ocorreu um erro. Verifique seus dados e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-in zoom-in-95 duration-700">
        <div className="modern-card p-10 flex flex-col items-center text-center gap-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-white shadow-xl shadow-accent/20">
            <Wallet size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">EagleFinance</h1>
            <p className="text-slate-500 font-medium">
              {isSignUp ? 'Crie sua conta e comece agora.' : 'Sua liberdade financeira começa aqui.'}
            </p>
          </div>

          <div className="w-full space-y-4">
            {!isSignUp && (
              <>
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 active:scale-95"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />}
                  Entrar com Google
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-slate-100 flex-1" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Ou use seu e-mail</span>
                  <div className="h-px bg-slate-100 flex-1" />
                </div>
              </>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <span className="text-left">{error}</span>
                </div>
              )}

              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Nome completo" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-12"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  placeholder="E-mail" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  placeholder="Senha" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {isSignUp ? 'Criar Conta' : 'Entrar na Conta'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-sm text-slate-500 font-medium">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'} 
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-accent font-bold hover:underline cursor-pointer ml-1"
            >
              {isSignUp ? 'Entrar' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
