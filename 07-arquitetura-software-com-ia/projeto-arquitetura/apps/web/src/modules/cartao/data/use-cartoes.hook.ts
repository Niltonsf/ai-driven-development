'use client';

// Hook de dados da consulta paginada de cartões.
//
// Concentra TODO o estado da consulta (lista, paginação, loading e erro) e a
// orquestração da chamada à API. Os componentes apenas consomem o resultado —
// não conhecem transporte nem mantêm estado de fetch.

import { useCallback, useEffect, useState } from 'react';
import type { PaginationMetaDTO } from '@arquitetura/shared';
import type { CartaoDTO } from '@arquitetura/cartao';
import { listCartoes } from './cartoes.client';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export type UseCartoesResult = {
  cartoes: CartaoDTO[];
  meta: PaginationMetaDTO | null;
  page: number;
  isLoading: boolean;
  error: string | null;
  goToPage: (page: number) => void;
  refetch: () => void;
};

export function useCartoes(pageSize: number = DEFAULT_PAGE_SIZE): UseCartoesResult {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [cartoes, setCartoes] = useState<CartaoDTO[]>([]);
  const [meta, setMeta] = useState<PaginationMetaDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Token incremental usado apenas para forçar uma nova execução do efeito.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listCartoes({ page, pageSize }, controller.signal);
        setCartoes(result.data);
        setMeta(result.meta);
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;
        setCartoes([]);
        setMeta(null);
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os cartões.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [page, pageSize, reloadToken]);

  const goToPage = useCallback((next: number) => setPage(Math.max(1, next)), []);
  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { cartoes, meta, page, isLoading, error, goToPage, refetch };
}
