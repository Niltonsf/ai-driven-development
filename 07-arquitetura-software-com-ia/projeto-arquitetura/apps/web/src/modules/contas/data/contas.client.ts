// Cliente de API do módulo de contas.
//
// Única fronteira de transporte do módulo: traduz parâmetros de domínio
// (paginação) em chamadas HTTP e devolve os contratos compartilhados. A UI
// nunca chama `fetch` diretamente — sempre passa por aqui (via hook).

import type { PaginatedInputDTO, PaginatedResultDTO } from '@arquitetura/shared';
import type { ContaDTO, SalvarContaIn } from '@arquitetura/contas';
import { apiRequest } from '@/shared/lib/api-client';

/** GET /contas — listagem paginada. */
export function listContas(
  input: PaginatedInputDTO,
  signal?: AbortSignal,
): Promise<PaginatedResultDTO<ContaDTO>> {
  const query = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  return apiRequest<PaginatedResultDTO<ContaDTO>>(`/contas?${query.toString()}`, { signal });
}

/**
 * GET /contas/:id — consulta uma conta por id.
 *
 * Usada pelo fluxo de edição para carregar a conta selecionada e pré-preencher
 * o formulário. O backend responde com o `ContaDTO` (ou 404 se não existir).
 */
export function getConta(id: string, signal?: AbortSignal): Promise<ContaDTO> {
  return apiRequest<ContaDTO>(`/contas/${id}`, { signal });
}

/**
 * POST /contas — salva uma conta (criar/atualizar).
 *
 * O backend expõe um único endpoint "salvar": sem `id` no payload cria; com
 * `id` atualiza. A resposta é vazia (204/200 sem corpo), por isso retorna
 * `void`. Tanto o fluxo de criação (já conectado) quanto o de atualização
 * (preparado) passam por aqui.
 */
export function salvarConta(payload: SalvarContaIn, signal?: AbortSignal): Promise<void> {
  return apiRequest<void>('/contas', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
}

/**
 * DELETE /contas/:id — exclui uma conta de forma permanente.
 *
 * Usada pelo fluxo de exclusão a partir da listagem. O backend responde 204
 * sem corpo (ou 404 se a conta não existir), por isso retorna `void`.
 */
export function excluirConta(id: string, signal?: AbortSignal): Promise<void> {
  return apiRequest<void>(`/contas/${id}`, { method: 'DELETE', signal });
}
