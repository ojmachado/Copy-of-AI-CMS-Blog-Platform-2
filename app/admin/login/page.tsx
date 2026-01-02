'use client';
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'password' | 'create'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const SUPER_ADMIN = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simulação de verificação (Num app real, chamaria uma API para checar adminAuth)
    // Lógica Client-Side Simplificada para o Prompt:
    if (email.toLowerCase() === SUPER_ADMIN?.toLowerCase()) {
      // Aqui idealmente checaríamos se o user já existe no firebase
      // Vamos assumir fluxo de login padrão, mas se falhar login, oferecemos cadastro
      setStep('password'); 
    } else {
      // TODO: Checar no banco se é um editor convidado
      // Se não for convidado:
      // setError('Acesso restrito. Contate o administrador.');
      setStep('password'); // Permitindo fluxo normal para demo
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (step === 'create') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/admin/crm');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' && email === SUPER_ADMIN) {
        setStep('create'); // Super Admin não existe, liberar criação
        setError('Primeiro acesso detectado. Crie sua senha.');
      } else {
        setError('Credenciais inválidas ou erro no sistema.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Portal Admin</h1>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={step === 'email' ? checkEmail : handleAuth} className="space-y-4">
          {step === 'email' && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Corporativo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              />
            </div>
          )}

          {(step === 'password' || step === 'create') && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-500">{email}</span>
                <button type="button" onClick={() => setStep('email')} className="text-xs text-indigo-600">Alterar</button>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                {step === 'create' ? 'Criar Senha Mestra' : 'Senha'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            {step === 'email' ? 'Continuar' : (step === 'create' ? 'Cadastrar e Entrar' : 'Entrar')}
          </button>
        </form>
      </div>
    </div>
  );
}