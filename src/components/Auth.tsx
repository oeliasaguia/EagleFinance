import React, { useState } from 'react';
import { BarChart3, Mail, Lock, ArrowRight, User, Loader2, AlertCircle } from 'lucide-react';
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
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Erro ao entrar com Google. Tente novamente.');
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
    <div className="min-h-screen bg-brand-gray flex items-center justify-center p-6 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/20 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-gold/10 rounded-full -ml-20 -mb-20 blur-3xl animate-pulse delay-700" />

      <div className="w-full max-w-md relative animate-in zoom-in-95 duration-700">
        <div className="bg-white border border-gray-200 p-10 flex flex-col items-center text-center gap-8 rounded-3xl shadow-2xl">
          <div className="w-20 h-20 bg-brand-gold rounded-3xl flex items-center justify-center text-brand-dark shadow-2xl shadow-brand-gold/20">
            <BarChart3 size={40} />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-brand-dark tracking-tight">EagleFinance</h1>
            <p className="text-gray-600">
              {isSignUp ? 'Crie sua conta e comece agora.' : 'Sua liberdade financeira começa aqui.'}
            </p>
          </div>

          <div className="w-full space-y-4">
            {!isSignUp && (
              <>
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-brand-dark py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-md disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />}
                  Entrar com Google
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Ou</span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>
              </>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <span className="text-left">{error}</span>
                </div>
              )}

              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Nome completo" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-brand-dark placeholder:text-gray-400 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  placeholder="E-mail" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-brand-dark placeholder:text-gray-400 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  placeholder="Senha" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-brand-dark placeholder:text-gray-400 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-gold text-brand-dark py-4 rounded-2xl font-bold hover:bg-brand-gold/90 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {isSignUp ? 'Criar Conta' : 'Entrar'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-sm text-gray-500">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'} 
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-brand-gold font-bold hover:underline cursor-pointer ml-1"
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
