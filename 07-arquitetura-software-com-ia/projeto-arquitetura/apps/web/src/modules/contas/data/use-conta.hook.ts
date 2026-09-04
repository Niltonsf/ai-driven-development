'use client';

// Hook de dados da consulta de UMA conta por id.
//
// Espelha o padrão de `useContas` (lista): concentra todo o estado da consulta
// (registro, loading e erro) e a orquestração da chamada à API. Serve ao fluxo
// de edição, que precisa carregar a conta selecionada antes de montar o
// formulário. Os componentes apenas consomem o resultado — não conhecem
// transporte nem mantêm estado de fetch.

import { useCallback, useEffect, useState } from 'react';
import type { ContaDTO } from '@arquitetura/contas';
import { getConta } from './contas.client';

export type UseContaResult = {
  conta: ContaDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useConta(id: string): UseContaResult {
  const [conta, setConta] = useState<ContaDTO | null>(null);
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
        const result = await getConta(id, controller.signal);
        setConta(result);
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;
        setConta(null);
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a conta.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { conta, isLoading, error, refetch };
}
