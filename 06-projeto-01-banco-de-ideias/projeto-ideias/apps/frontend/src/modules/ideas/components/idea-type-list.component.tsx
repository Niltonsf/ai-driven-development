'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
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
  IdeaTypeView,
  deleteIdeaType,
  listIdeaTypes,
  loadDefaultIdeaTypes,
} from '../util/idea-type-api.util';

const PAGE_SIZE = 10;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(value: string, max = 80): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

export function IdeaTypeListComponent() {
  const router = useRouter();
  const [items, setItems] = useState<IdeaTypeView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<IdeaTypeView | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  const fetchPage = useCallback(async (nextPage: number) => {
    setLoading(true);
    try {
      const data = await listIdeaTypes({ page: nextPage, pageSize: PAGE_SIZE });
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      if (error instanceof IdeaTypeApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteIdeaType(pendingDelete.id);
      toast.success('Tipo de Ideia removido.');
      setPendingDelete(null);
      await fetchPage(page);
    } catch (error) {
      if (error instanceof IdeaTypeApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleLoadDefaults() {
    setLoadingDefaults(true);
    try {
      const { loaded } = await loadDefaultIdeaTypes();
      if (loaded > 0) {
        toast.success(`${loaded} Tipo(s) de Ideia padrão carregado(s).`);
        await fetchPage(1);
      } else {
        toast.info('Você já possui Tipos de Ideia cadastrados.');
      }
    } catch (error) {
      if (error instanceof IdeaTypeApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setLoadingDefaults(false);
    }
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Tipos de Ideia"
        title="Tipos de Ideia"
        subtitle="Modelos de prompt utilizados ao processar Ideias."
        aside={
          total > 0 ? (
            <Button asChild>
              <Link href="/idea-types/new">
                <Plus className="size-4" />
                Cadastrar Tipo de Ideia
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
            title="Nenhum Tipo de Ideia cadastrado"
            subtitle="Comece cadastrando um Tipo de Ideia para usar ao processar suas ideias."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/idea-types/new">
                <Plus className="size-4" />
                Cadastrar Tipo de Ideia
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleLoadDefaults}
              disabled={loadingDefaults}
            >
              <Download className="size-4" />
              Carregar Tipos de Ideia padrão
            </Button>
          </div>
        </div>
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Atualizado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {truncate(item.description)}
                  </TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/idea-types/${item.id}/edit`)}
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
        title="Excluir Tipo de Ideia"
        description="Esta ação remove o Tipo de Ideia permanentemente."
        itemLabel="Tipo de Ideia"
        itemValue={pendingDelete?.name}
        isConfirming={deleting}
      />
    </div>
  );
}
