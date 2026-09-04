'use client';

// Hook de dados da exclusão de uma conta.
//
// Concentra TODO o estado da mutação de exclusão (enviando / erro) e a chamada
// à API. Mantém-se desacoplado da listagem: o componente decide o que fazer no
// sucesso (fechar diálogo, recarregar a lista). Os componentes apenas consomem
// o resultado — não conhecem transporte nem sabem traduzir erros.

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import { getErrorMessage } from '@/shared/i18n';
import { excluirConta } from './contas.client';

export type UseExcluirContaResult = {
  isExcluindo: boolean;
  /** Erro da exclusão (transporte/negócio) já traduzido para exibição. */
  error: string | null;
  /** Limpa o erro atual (ex.: ao reabrir o diálogo). */
  resetError: () => void;
  /**
   * Executa a exclusão. Retorna `true` em caso de sucesso e `false` em caso de
   * falha (o erro fica disponível em `error`), evitando que o chamador precise
   * tratar exceções.
   */
  excluir: (id: string) => Promise<boolean>;
};

/** Traduz qualquer falha de exclusão para uma mensagem amigável. */
function resolveExcluirError(cause: unknown): string {
  if (cause instanceof ApiError) {
    // O backend responde erros de negócio em `{ message: string[] }`.
    return getErrorMessage({ response: { data: cause.details } });
  }

  return getErrorMessage(cause);
}

export function useExcluirConta(): UseExcluirContaResult {
  const [isExcluindo, setIsExcluindo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => setError(null), []);

  const excluir = useCallback(async (id: string): Promise<boolean> => {
    setIsExcluindo(true);
    setError(null);

    try {
      await excluirConta(id);
      toast.success('Conta excluída com sucesso.');
      return true;
    } catch (cause: unknown) {
      setError(resolveExcluirError(cause));
      return false;
    } finally {
      setIsExcluindo(false);
    }
  }, []);

  return { isExcluindo, error, resetError, excluir };
}
