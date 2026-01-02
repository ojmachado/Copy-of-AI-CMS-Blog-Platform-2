
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { getFirebaseConfigStatus } from '../lib/firebase';
import { AuthStep } from '../types';
import { 
  Sparkles, 
  Lock, 
  User, 
  AlertTriangle, 
  RefreshCw,
  Key,
  Code2,
  ChevronRight,
  ClipboardCheck,
  Database,
  Settings
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();

  const [step, setStep] = useState<AuthStep>(AuthStep.EMAIL);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{title: string, message: string, code?: string} | null>(null);
  
  // Detecção de Configuração
  const [forceSetup, setForceSetup] = useState(false);
  const [configStatus, setConfigStatus] = useState<{isValid: boolean, missingKeys: string[]}>({isValid: true, missingKeys: []});
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    const status = getFirebaseConfigStatus();
    setConfigStatus(status);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    try {
      const nextStep = await authService.checkEmailStatus(email);
      if (nextStep === AuthStep.BLOCKED) {
        setError({
            title: 'Acesso Restrito',
            message: 'E-mail não autorizado para acessar este portal.'
        });
      } else {
        setStep(nextStep);
      }
    } catch (err: any) {
      setError({
          title: 'Erro de Conexão',
          message: 'Falha ao conectar com o Firebase. Verifique suas chaves ou use a Configuração Manual.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = step === AuthStep.CREATE_PASSWORD 
        ? await authService.registerSuperAdmin(email, password)
        : await authService.login(email, password);
      login(user);
      navigate('/admin');
    } catch (err: any) {
      setError({ 
        title: 'Falha na Autenticação', 
        message: 'Senha incorreta ou erro no servidor de autenticação.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualConfigSave = () => {
    try {
      let raw = manualInput.trim();
      raw = raw.replace(/const\s+\w+\s*=\s*/g, '');
      raw = raw.replace(/export\s+default\s+\w+\s*;?/g, '');
      raw = raw.replace(/;/g, '');
      
      const jsonString = raw
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') 
        .replace(/'/g, '"') 
        .replace(/,\s*}/g, '}'); 
      
      const config = JSON.parse(jsonString);
      
      if (config.apiKey && config.projectId) {
        localStorage.setItem('firebase_manual_config', JSON.stringify(config));
        window.location.reload();
      } else {
        alert("Configuração incompleta. Certifique-se de copiar o objeto que contém 'apiKey' e 'projectId'.");
      }
    } catch (e) {
      alert("Erro ao ler os dados. Tente colar apenas o que está entre as chaves { ... }");
    }
  };

  // Se as chaves estiverem faltando OU o usuário forçar o setup
  if (!configStatus.isValid || forceSetup) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-10 font-sans selection:bg-indigo-500 selection:text-white">
        <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300">
          
          <div className="md:w-1/2 bg-slate-950 p-10 md:p-16 text-white space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
                <div className="p-4 bg-indigo-600 w-fit rounded-2xl shadow-xl shadow-indigo-500/20">
                <Database size={28} />
                </div>
                <div className="space-y-4">
                <h2 className="text-3xl font-black leading-tight">Configuração do Firebase</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Detectamos que seu aplicativo ainda não está vinculado a um projeto do Firebase.
                </p>
                </div>

                <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="mt-1 p-1 bg-indigo-500 rounded-full"><ChevronRight size={12} /></div>
                    <p className="text-[11px] text-slate-300 font-medium">Copie o objeto <strong>firebaseConfig</strong> do console do Firebase.</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="mt-1 p-1 bg-indigo-500 rounded-full"><ChevronRight size={12} /></div>
                    <p className="text-[11px] text-slate-300 font-medium">Certifique-se de ativar <strong>Auth</strong> e <strong>Firestore</strong>.</p>
                </div>
                </div>
            </div>
            
            {forceSetup && (
                <button 
                    onClick={() => setForceSetup(false)}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                    Voltar para o Login
                </button>
            )}
          </div>

          <div className="md:w-1/2 p-10 md:p-16 bg-white flex flex-col justify-center space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                <Code2 size={16} /> Setup Manual
              </div>
              <h1 className="text-3xl font-black text-slate-900">Vincular Projeto</h1>
              <p className="text-slate-500 text-sm">Cole o código de configuração abaixo.</p>
            </div>

            <div className="space-y-4">
              <textarea 
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={`{\n  apiKey: "AIza...",\n  projectId: "meu-app",\n  ...\n}`}
                className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-mono focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all resize-none shadow-inner"
              />
              <button 
                onClick={handleManualConfigSave}
                disabled={!manualInput.trim()}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 group"
              >
                Salvar e Inicializar <ClipboardCheck size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-slate-50 selection:bg-indigo-500 selection:text-white relative">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 space-y-10 z-10">
        <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner">
                 <Sparkles size={32} />
            </div>
            <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {step === AuthStep.CREATE_PASSWORD ? 'Ativar Admin' : 'Bem-vindo'}
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                    {step === AuthStep.EMAIL && 'Informe seu e-mail administrativo.'}
                    {step === AuthStep.PASSWORD && 'Identificamos você. Informe sua senha.'}
                    {step === AuthStep.CREATE_PASSWORD && 'Defina sua senha mestra de segurança.'}
                </p>
            </div>
        </div>

        {error && (
            <div className="rounded-2xl p-4 flex items-start gap-4 bg-red-50 text-red-700 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div className="text-xs">
                    <p className="font-bold uppercase tracking-widest text-[10px] mb-1">{error.title}</p>
                    <p className="opacity-80 leading-relaxed font-medium">{error.message}</p>
                </div>
            </div>
        )}

        {step === AuthStep.EMAIL ? (
            <form className="space-y-6" onSubmit={handleEmailSubmit}>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">E-mail</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                            <User size={20} />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-2xl border-slate-200 py-4.5 pl-14 pr-4 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all border shadow-sm placeholder:text-slate-300"
                            placeholder="seu@email.com"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: theme.primaryColor }}
                >
                    {isLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Continuar'}
                </button>
            </form>
        ) : (
            <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Senha</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                            <Lock size={20} />
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-2xl border-slate-200 py-4.5 pl-14 pr-4 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all border shadow-sm placeholder:text-slate-300"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: theme.primaryColor }}
                >
                    {isLoading ? <RefreshCw className="animate-spin" size={18} /> : (step === AuthStep.CREATE_PASSWORD ? 'Criar e Entrar' : 'Entrar')}
                </button>
            </form>
        )}
        
        <div className="pt-4 text-center border-t border-slate-100">
            <button 
                onClick={() => setForceSetup(true)}
                className="text-[9px] font-black uppercase text-slate-300 hover:text-indigo-400 transition-colors tracking-widest flex items-center justify-center gap-2 mx-auto"
            >
                <Settings size={12} /> Configurar Firebase Manualmente
            </button>
        </div>
      </div>
    </div>
  );
};
