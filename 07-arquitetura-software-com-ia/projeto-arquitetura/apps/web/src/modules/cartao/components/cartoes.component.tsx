'use client';

// Listagem paginada de cartões (componente de apresentação).
//
// "Burro" o suficiente: consome o estado pronto de `useCartoes` e renderiza os
// estados de carregando / erro / vazio / dados. Não conhece transporte nem URLs.
// Novo e editar navegam para suas rotas (`/cartao/nova` e `/cartao/[id]/editar`);
// excluir abre um diálogo de confirmação e delega a mutação ao `useExcluirCartao`.

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { CartaoDTO } from '@arquitetura/cartao';
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
import { useCartoes } from '../data/use-cartoes.hook';
import { useExcluirCartao } from '../data/use-excluir-cartao.hook';

const COLUMN_COUNT = 6;

/** Formata o limite numérico opcional como moeda; ausência vira travessão. */
function formatLimit(limit?: number): string {
  if (limit === undefined || limit === null) return '—';
  return limit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CartoesComponent() {
  const { cartoes, meta, page, isLoading, error, goToPage, refetch } = useCartoes();
  const { isExcluindo, error: excluirError, resetError, excluir } = useExcluirCartao();

  // Cartão selecionado para exclusão; `null` mantém o diálogo fechado.
  const [cartaoParaExcluir, setCartaoParaExcluir] = useState<CartaoDTO | null>(null);

  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.total;
  const showEmptyState = !isLoading && !error && cartoes.length === 0;

  function abrirExclusao(cartao: CartaoDTO) {
    resetError();
    setCartaoParaExcluir(cartao);
  }

  function handleExclusaoOpenChange(open: boolean) {
    // Não permite fechar enquanto a exclusão está em andamento.
    if (!open && isExcluindo) return;
    if (!open) resetError();
    setCartaoParaExcluir((atual) => (open ? atual : null));
  }

  async function confirmarExclusao() {
    if (!cartaoParaExcluir?.id) return;

    const ok = await excluir(cartaoParaExcluir.id);
    if (!ok) return;

    setCartaoParaExcluir(null);
    // Se a página atual ficar vazia após remover o único item, recua uma página.
    if (cartoes.length === 1 && page > 1) {
      goToPage(page - 1);
    } else {
      refetch();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/cartao/nova">
            <Plus className="size-4" />
            Novo cartão
          </Link>
        </Button>
      </div>

      <TableCard
        title="Cartões"
        subtitle="Consulte os cartões cadastrados."
        footer={
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            totalLabel="cartões"
            onPageChange={goToPage}
            disabled={isLoading || Boolean(error)}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Nome</TableHead>
              <TableHead>Bandeira</TableHead>
              <TableHead>Final</TableHead>
              <TableHead>Limite</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="pr-5 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? <LoadingRows /> : null}

            {!isLoading && error ? <ErrorRow message={error} onRetry={refetch} /> : null}

            {showEmptyState ? <EmptyRow /> : null}

            {!isLoading && !error
              ? cartoes.map((cartao) => (
                  <TableRow key={cartao.id}>
                    <TableCell className="pl-5 font-medium">
                      <div className="flex items-center gap-3">
                        <LucideIconByKey
                          name={cartao.icon}
                          backgroundColor={cartao.color}
                          withBackgroundCircle
                        />
                        <span>{cartao.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{cartao.flag ?? '—'}</TableCell>
                    <TableCell>{cartao.lastDigits ? `•••• ${cartao.lastDigits}` : '—'}</TableCell>
                    <TableCell>{formatLimit(cartao.limit)}</TableCell>
                    <TableCell>
                      <Badge variant={cartao.active ? 'default' : 'secondary'}>
                        {cartao.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar o cartão ${cartao.name}`}
                        >
                          <Link href={`/cartao/${cartao.id}/editar`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirExclusao(cartao)}
                          aria-label={`Excluir o cartão ${cartao.name}`}
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
        open={cartaoParaExcluir !== null}
        onOpenChange={handleExclusaoOpenChange}
        onConfirm={confirmarExclusao}
        title="Excluir cartão"
        description="Esta ação remove o cartão selecionado de forma permanente."
        itemLabel="Cartão"
        itemValue={cartaoParaExcluir?.name}
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
          title="Nenhum cartão cadastrado"
          subtitle="Cadastre o primeiro cartão para começar a organizar suas finanças."
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
            <p className="font-medium">Não foi possível carregar os cartões</p>
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
