import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppLogo } from '@/shared/components/branding/app-logo.component';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { AuthForm } from '@/modules/auth';

/**
 * Tela de autenticação (rota `/join`).
 *
 * Mantém o esqueleto/branding da tela (Card + AppLogo + fundo em gradiente) e
 * renderiza o formulário real de autenticação (`AuthForm`), que suporta os
 * fluxos de registro e login.
 */
export default function AuthPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_45%)]" />

      <Card className="relative w-full max-w-md border-white/10 bg-zinc-950/80 p-8 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-6">
          <AppLogo size="lg" priority />

          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold">Autenticação</h1>
            <p className="text-sm text-muted-foreground">Crie sua conta ou entre para continuar.</p>
          </div>

          <AuthForm />

          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
