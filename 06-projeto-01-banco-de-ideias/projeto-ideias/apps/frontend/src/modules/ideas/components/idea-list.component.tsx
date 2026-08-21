'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { TableCard } from '@/shared/components/ui/table-card';
import { getMessage } from '@/shared/i18n';
import {
  IdeaTypeApiError,
  listIdeaTypes,
} from '../util/idea-type-api.util';
import {
  IdeaApiError,
  IdeaView,
  deleteIdea,
  listIdeas,
} from '../util/idea-api.util';

const PAGE_SIZE = 10;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function IdeaListComponent() {
  const router = useRouter();
  const [items, setItems] = useState<IdeaView[]>([]);
  const [ideaTypeNames, setIdeaTypeNames] = useState<Record<string, string>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<IdeaView | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPage = useCallback(async (nextPage: number) => {
    setLoading(true);
    try {
      const data = await listIdeas({ page: nextPage, pageSize: PAGE_SIZE });
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      if (error instanceof IdeaApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIdeaTypeNames = useCallback(async () => {
    try {
      const data = await listIdeaTypes({ page: 1, pageSize: 100 });
      const map: Record<string, string> = {};
      data.items.forEach((item) => {
        map[item.id] = item.name;
      });
      setIdeaTypeNames(map);
    } catch (error) {
      if (error instanceof IdeaTypeApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
    fetchIdeaTypeNames();
  }, [fetchPage, fetchIdeaTypeNames]);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteIdea(pendingDelete.id);
      toast.success('Ideia removida.');
      setPendingDelete(null);
      await fetchPage(page);
    } catch (error) {
      if (error instanceof IdeaApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Ideias"
        title="Ideias"
        subtitle="Cadastre e gerencie as suas Ideias."
        aside={
          total > 0 ? (
            <Button asChild>
              <Link href="/ideas/new">
                <Plus className="size-4" />
                Cadastrar Ideia
              </Link>
            </Button>
          ) : null
        }
      />

      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-6">
          <EmptyListState
            title="Nenhuma Ideia cadastrada"
            subtitle="Comece cadastrando a sua primeira Ideia."
          />
          <Button asChild>
            <Link href="/ideas/new">
              <Plus className="size-4" />
              Cadastrar Ideia
            </Link>
          </Button>
        </div>
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo de Ideia</TableHead>
                <TableHead>Atualizado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {ideaTypeNames[item.ideaTypeId] ?? '—'}
                  </TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/ideas/${item.id}/edit`)}
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(item)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Página {page} de {totalPages} · {total} registro(s)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPage(page - 1)}
                  disabled={page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          ) : null}
        </TableCard>
      )}

      <DeleteConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Ideia"
        description="Esta ação remove a Ideia permanentemente."
        itemLabel="Ideia"
        itemValue={pendingDelete?.name}
        isConfirming={deleting}
      />
    </div>
  );
}
