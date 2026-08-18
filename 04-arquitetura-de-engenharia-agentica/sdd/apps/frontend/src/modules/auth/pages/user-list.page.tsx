'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { PaginationControls } from '@/shared/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { TableCard } from '@/shared/components/ui/table-card';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '../context/auth.context';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface UserItem {
  id: string;
  name: string;
  email: string;
}

interface PageResult {
  items: UserItem[];
  total: number;
  page: number;
  perPage: number;
}

const PER_PAGE = 10;

export function UserListPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/users?page=${targetPage}&perPage=${PER_PAGE}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const body: PageResult = await res.json();
        setData(body);
      } catch {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/users/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) {
        toast.success('Usuário excluído com sucesso.');
        setDeleteTarget(null);
        const nextPage = data && data.items.length === 1 && page > 1 ? page - 1 : page;
        setPage(nextPage);
        fetchUsers(nextPage);
        return;
      }
      const body: ApiErrorResponse = await res.json();
      for (const code of body.errors) toast.error(getMessage(code));
    } catch {
      toast.error(getMessage('DEFAULT_API_ERROR'));
    } finally {
      setIsDeleting(false);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PER_PAGE)) : 1;

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Cadastro"
        title="Usuários"
        subtitle="Gerencie os usuários da plataforma."
        aside={
          <Button onClick={() => router.push('/auth/users/new')}>
            <UserPlus className="size-4" />
            Novo usuário
          </Button>
        }
      />

      <TableCard
        footer={
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={data?.total}
            totalLabel="usuários"
            onPageChange={setPage}
            disabled={loading}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-5">Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-24 text-right px-5">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : !data || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-5 font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="px-5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${user.name}`}
                        onClick={() => router.push(`/auth/users/${user.id}/edit`)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir ${user.name}`}
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>

      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Excluir usuário"
        description="Esta ação remove o usuário de forma permanente."
        itemLabel="Usuário"
        itemValue={deleteTarget?.name}
        isConfirming={isDeleting}
      />
    </div>
  );
}
