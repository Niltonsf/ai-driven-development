'use client';

// Hook de dados da consulta de UM cartão por id.
//
// Espelha o padrão de `useCartoes` (lista): concentra todo o estado da consulta
// (registro, loading e erro) e a orquestração da chamada à API. Serve ao fluxo
// de edição, que precisa carregar o cartão selecionado antes de montar o
// formulário. Os componentes apenas consomem o resultado — não conhecem
// transporte nem mantêm estado de fetch.

import { useCallback, useEffect, useState } from 'react';
import type { CartaoDTO } from '@arquitetura/cartao';
import { getCartao } from './cartoes.client';

export type UseCartaoResult = {
  cartao: CartaoDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useCartao(id: string): UseCartaoResult {
  const [cartao, setCartao] = useState<CartaoDTO | null>(null);
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
        const result = await getCartao(id, controller.signal);
        setCartao(result);
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;
        setCartao(null);
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o cartão.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { cartao, isLoading, error, refetch };
}
