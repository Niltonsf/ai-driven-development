'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '../context/auth.context';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

export default function AuthComponent() {
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 200) {
        const body: LoginResponse = await res.json();
        auth.login(body.token);
        toast.success('Login realizado com sucesso!');
        router.push('/example/dashboard');
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
        <Label htmlFor="login-email" className="text-white/70">
          E-mail
        </Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          placeholder="joao@email.com"
          required
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-amber-400/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password" className="text-white/70">
          Senha
        </Label>
        <Input
          id="login-password"
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
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
