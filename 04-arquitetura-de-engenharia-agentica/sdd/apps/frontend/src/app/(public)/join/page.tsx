'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '@/modules/auth';
import AuthComponent from '@/modules/auth/components/auth.component';

type Mode = 'register' | 'login';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function RegisterForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = data.get('name') as string;
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.status === 201) {
        toast.success('Cadastro realizado com sucesso!');
        form.reset();
        return;
      }

      const body: ApiErrorResponse = await res.json();
      for (const code of body.errors) {
        toast.error(getMessage(code));
      }
    } catch {
      toast.error(getMessage('DEFAULT_API_ERROR'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-name" className="text-white/70">
          Nome completo
        </Label>
        <Input
          id="register-name"
          name="name"
          type="text"
          placeholder="João Silva"
          required
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-amber-400/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email" className="text-white/70">
          E-mail
        </Label>
        <Input
          id="register-email"
          name="email"
          type="email"
          placeholder="joao@email.com"
          required
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-amber-400/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-password" className="text-white/70">
          Senha
        </Label>
        <Input
          id="register-password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-amber-400/50"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full bg-amber-400 font-bold text-black hover:bg-amber-300 disabled:opacity-60"
      >
        {loading ? 'Cadastrando...' : 'Criar conta'}
      </Button>
    </form>
  );
}

export default function JoinPage() {
  const [mode, setMode] = useState<Mode>('register');
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/example/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <Layers className="size-7 text-amber-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight">Aplicação</h1>
            <p className="mt-1 text-sm text-white/50">
              {mode === 'register' ? 'Crie sua conta' : 'Entre na sua conta'}
            </p>
          </div>
        </div>

        {mode === 'register' ? <RegisterForm /> : <AuthComponent />}

        <button
          type="button"
          onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          className="text-xs text-white/30 transition-colors hover:text-white/60"
        >
          {mode === 'register'
            ? 'Já tem conta? Entrar'
            : 'Não tem conta? Criar conta'}
        </button>

        <Link
          href="/"
          className="text-xs text-white/30 transition-colors hover:text-white/60"
        >
          ← Voltar para o início
        </Link>
      </div>
    </div>
  );
}
