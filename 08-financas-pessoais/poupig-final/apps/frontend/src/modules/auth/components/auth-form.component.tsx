'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { v } from '@/shared/components/form/validator';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  loginSchema,
  registerSchema,
  useRegister,
  useLogin,
  type LoginFormData,
  type RegisterFormData,
} from '../data';

type AuthMode = 'register' | 'login';

/**
 * Formulário de autenticação (registro + login) da rota `/join`.
 *
 * Componente puramente de apresentação: a validação usa o validador `v` com os
 * value objects compartilhados e o envio é delegado ao hook `useAuth`
 * (camada `data/`). Nenhum `fetch` inline.
 */
export function AuthForm() {
  const router = useRouter();
  const { register: registerUser, isSubmitting: isRegisterSubmitting } = useRegister();
  const { login, isSubmitting: isLoginSubmitting } = useLogin();
  const isSubmitting = isRegisterSubmitting || isLoginSubmitting;
  const [mode, setMode] = useState<AuthMode>('register');

  const registerForm = useForm<RegisterFormData>({
    resolver: v.resolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: v.resolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onRegisterSubmit(data: RegisterFormData) {
    const result = await registerUser(data);
    if (result.ok) {
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      registerForm.reset();
      loginForm.setValue('email', data.email);
      setMode('login');
      return;
    }
    toast.error(result.error);
  }

  async function onLoginSubmit(data: LoginFormData) {
    const result = await login(data);
    if (result.ok) {
      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
      return;
    }
    toast.error(result.error);
    loginForm.setError('root', { message: result.error });
  }

  return (
    <div className="flex w-full flex-col gap-6 text-left">
      <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register">Criar conta</TabsTrigger>
          <TabsTrigger value="login">Entrar</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === 'register' ? (
        <form
          key="register-form"
          noValidate
          className="flex flex-col gap-4"
          onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
        >
          <div className="flex flex-col">
            <Label htmlFor="register-name">Nome</Label>
            <Input
              id="register-name"
              autoComplete="name"
              placeholder="Seu nome completo"
              aria-invalid={!!registerForm.formState.errors.name}
              {...registerForm.register('name')}
            />
            {registerForm.formState.errors.name && (
              <FormErrorMessage className="mt-1.5">{registerForm.formState.errors.name.message}</FormErrorMessage>
            )}
          </div>

          <div className="flex flex-col">
            <Label htmlFor="register-email">E-mail</Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              aria-invalid={!!registerForm.formState.errors.email}
              {...registerForm.register('email')}
            />
            {registerForm.formState.errors.email && (
              <FormErrorMessage className="mt-1.5">{registerForm.formState.errors.email.message}</FormErrorMessage>
            )}
          </div>

          <div className="flex flex-col">
            <Label htmlFor="register-password">Senha</Label>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!registerForm.formState.errors.password}
              {...registerForm.register('password')}
            />
            {registerForm.formState.errors.password && (
              <FormErrorMessage className="mt-1.5">{registerForm.formState.errors.password.message}</FormErrorMessage>
            )}
          </div>

          <Button type="submit" className="mt-2" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Criar conta
          </Button>
        </form>
      ) : (
        <form
          key="login-form"
          noValidate
          className="flex flex-col gap-4"
          onSubmit={loginForm.handleSubmit(onLoginSubmit)}
        >
          <div className="flex flex-col">
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              aria-invalid={!!loginForm.formState.errors.email}
              {...loginForm.register('email')}
            />
            {loginForm.formState.errors.email && (
              <FormErrorMessage className="mt-1.5">{loginForm.formState.errors.email.message}</FormErrorMessage>
            )}
          </div>

          <div className="flex flex-col">
            <Label htmlFor="login-password">Senha</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!loginForm.formState.errors.password}
              {...loginForm.register('password')}
            />
            {loginForm.formState.errors.password && (
              <FormErrorMessage className="mt-1.5">{loginForm.formState.errors.password.message}</FormErrorMessage>
            )}
          </div>

          {loginForm.formState.errors.root && (
            <FormErrorMessage>{loginForm.formState.errors.root.message}</FormErrorMessage>
          )}

          <Button type="submit" className="mt-2" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      )}
    </div>
  );
}
