'use client';

// Listagem paginada de contas (componente de apresentação).
//
// "Burro" o suficiente: consome o estado pronto de `useContas` e renderiza os
// estados de carregando / erro / vazio / dados. Não conhece transporte nem URLs.
// Novo e editar navegam para suas rotas (`/contas/nova` e `/contas/[id]/editar`);
// excluir abre um diálogo de confirmação e delega a mutação ao `useExcluirConta`.

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { ContaDTO } from '@arquitetura/contas';
import { Badge } from '@/shared/components/ui/badge';
import { LucideIconByKey } from '@/shared/components/ui/lucide-icon-by-key';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { PaginationControls } from '@/shared/components/ui/pagination-controls';
import { TableCard } from '@/shared/components/ui/table-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { useContas } from '../data/use-contas.hook';
import { useExcluirConta } from '../data/use-excluir-conta.hook';

const COLUMN_COUNT = 6;

export function ContasComponent() {
  const { contas, meta, page, isLoading, error, goToPage, refetch } = useContas();
  const { isExcluindo, error: excluirError, resetError, excluir } = useExcluirConta();

  // Conta selecionada para exclusão; `null` mantém o diálogo fechado.
  const [contaParaExcluir, setContaParaExcluir] = useState<ContaDTO | null>(null);

  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.total;
  const showEmptyState = !isLoading && !error && contas.length === 0;

  function abrirExclusao(conta: ContaDTO) {
    resetError();
    setContaParaExcluir(conta);
  }

  function handleExclusaoOpenChange(open: boolean) {
    // Não permite fechar enquanto a exclusão está em andamento.
    if (!open && isExcluindo) return;
    if (!open) resetError();
    setContaParaExcluir((atual) => (open ? atual : null));
  }

  async function confirmarExclusao() {
    if (!contaParaExcluir?.id) return;

    const ok = await excluir(contaParaExcluir.id);
    if (!ok) return;

    setContaParaExcluir(null);
    // Se a página atual ficar vazia após remover o único item, recua uma página.
    if (contas.length === 1 && page > 1) {
      goToPage(page - 1);
    } else {
      refetch();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/contas/nova">
            <Plus className="size-4" />
            Nova conta
          </Link>
        </Button>
      </div>

      <TableCard
        title="Contas"
        subtitle="Consulte as contas cadastradas."
        footer={
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            totalLabel="contas"
            onPageChange={goToPage}
            disabled={isLoading || Boolean(error)}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Nome</TableHead>
              <TableHead>Instituição</TableHead>
              <TableHead>Agência</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="pr-5 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? <LoadingRows /> : null}

            {!isLoading && error ? (
              <ErrorRow message={error} onRetry={refetch} />
            ) : null}

            {showEmptyState ? <EmptyRow /> : null}

            {!isLoading && !error
              ? contas.map((conta) => (
                  <TableRow key={conta.id}>
                    <TableCell className="pl-5 font-medium">
                      <div className="flex items-center gap-3">
                        <LucideIconByKey
                          name={conta.icon}
                          backgroundColor={conta.color}
                          withBackgroundCircle
                        />
                        <span>{conta.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{conta.institutionName ?? '—'}</TableCell>
                    <TableCell>{conta.agency ?? '—'}</TableCell>
                    <TableCell>{conta.accountNumber ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={conta.active ? 'default' : 'secondary'}>
                        {conta.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar a conta ${conta.name}`}
                        >
                          <Link href={`/contas/${conta.id}/editar`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirExclusao(conta)}
                          aria-label={`Excluir a conta ${conta.name}`}
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </TableCard>

      <DeleteConfirmationDialog
        open={contaParaExcluir !== null}
        onOpenChange={handleExclusaoOpenChange}
        onConfirm={confirmarExclusao}
        title="Excluir conta"
        description="Esta ação remove a conta selecionada de forma permanente."
        itemLabel="Conta"
        itemValue={contaParaExcluir?.name}
        isConfirming={isExcluindo}
        confirmDisabledMessage={excluirError ?? undefined}
      />
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: COLUMN_COUNT }).map((__, cellIndex) => (
            <TableCell key={cellIndex} className={cellIndex === 0 ? 'pl-5' : undefined}>
              <div className="h-4 w-full max-w-32 animate-pulse rounded bg-white/10" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyRow() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={COLUMN_COUNT} className="py-10">
        <EmptyListState
          title="Nenhuma conta cadastrada"
          subtitle="Cadastre a primeira conta para começar a organizar suas finanças."
        />
      </TableCell>
    </TableRow>
  );
}

function ErrorRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={COLUMN_COUNT} className="py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium">Não foi possível carregar as contas</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
