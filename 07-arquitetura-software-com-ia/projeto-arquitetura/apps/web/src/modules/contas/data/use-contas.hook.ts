'use client';

// Hook de dados da consulta paginada de contas.
//
// Concentra TODO o estado da consulta (lista, paginação, loading e erro) e a
// orquestração da chamada à API. Os componentes apenas consomem o resultado —
// não conhecem transporte nem mantêm estado de fetch.

import { useCallback, useEffect, useState } from 'react';
import type { PaginationMetaDTO } from '@arquitetura/shared';
import type { ContaDTO } from '@arquitetura/contas';
import { listContas } from './contas.client';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export type UseContasResult = {
  contas: ContaDTO[];
  meta: PaginationMetaDTO | null;
  page: number;
  isLoading: boolean;
  error: string | null;
  goToPage: (page: number) => void;
  refetch: () => void;
};

export function useContas(pageSize: number = DEFAULT_PAGE_SIZE): UseContasResult {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [contas, setContas] = useState<ContaDTO[]>([]);
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
        const result = await listContas({ page, pageSize }, controller.signal);
        setContas(result.data);
        setMeta(result.meta);
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;
        setContas([]);
        setMeta(null);
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as contas.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [page, pageSize, reloadToken]);

  const goToPage = useCallback((next: number) => setPage(Math.max(1, next)), []);
  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { contas, meta, page, isLoading, error, goToPage, refetch };
}
