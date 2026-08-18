'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '../context/auth.context';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface UserFormProps {
  userId?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

export function UserFormPage({ userId }: UserFormProps) {
  const { token } = useAuth();
  const router = useRouter();
  const isEdit = Boolean(userId);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    async function loadUser() {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user: UserData = await res.json();
        setName(user.name);
        setEmail(user.email);
      } else {
        toast.error(getMessage('user.not_found'));
        router.push('/auth/users');
      }
      setLoading(false);
    }
    loadUser();
  }, [userId, token, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password && password !== confirm) {
      toast.error(getMessage('user.password.confirmation_mismatch'));
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = { name, email };
      if (password) body.password = password;

      const url = isEdit ? `${API_URL}/users/${userId}` : `${API_URL}/users`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 200 || res.status === 201) {
        toast.success(isEdit ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.');
        router.push('/auth/users');
        return;
      }

      const errorBody: ApiErrorResponse = await res.json();
      for (const code of errorBody.errors) toast.error(getMessage(code));
    } catch {
      toast.error(getMessage('DEFAULT_API_ERROR'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Carregando…</div>
    );
  }

  return (
    <div className="space-y-8">
      <PageSectionHeader
        badge="Cadastro"
        title={isEdit ? 'Editar usuário' : 'Novo usuário'}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <FormSectionLayout title="Dados básicos" description="Nome e e-mail de acesso do usuário.">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nome completo</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João Silva"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">E-mail</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@email.com"
              required
            />
          </div>
        </FormSectionLayout>

        <FormSectionLayout
          title="Senha"
          description={isEdit ? 'Deixe em branco para manter a senha atual.' : 'Defina a senha de acesso.'}
          showDivider={false}
        >
          <div className="space-y-2">
            <Label htmlFor="user-password">Senha{isEdit ? ' (opcional)' : ''}</Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Informe para alterar a senha' : 'Informe a senha de acesso'}
              required={!isEdit}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-confirm">Confirmar senha{isEdit ? ' (opcional)' : ''}</Label>
            <Input
              id="user-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={isEdit ? 'Repita a nova senha' : 'Repita a senha de acesso'}
              required={!isEdit}
              autoComplete="new-password"
            />
          </div>
        </FormSectionLayout>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/auth/users')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
        </div>
      </form>
    </div>
  );
}
