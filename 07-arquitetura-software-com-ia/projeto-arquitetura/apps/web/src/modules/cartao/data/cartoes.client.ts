// Cliente de API do módulo de cartões.
//
// Única fronteira de transporte do módulo: traduz parâmetros de domínio
// (paginação) em chamadas HTTP e devolve os contratos compartilhados. A UI
// nunca chama `fetch` diretamente — sempre passa por aqui (via hook).

import type { PaginatedInputDTO, PaginatedResultDTO } from '@arquitetura/shared';
import type { CartaoDTO, SalvarCartaoIn } from '@arquitetura/cartao';
import { apiRequest } from '@/shared/lib/api-client';

// O backend expõe o controlador em `/cartao` (singular) — ver
// `apps/backend/src/modules/cartao/cartao.controller.ts` (`@Controller('cartao')`).
// O cliente consome exatamente a rota publicada pelo backend.
const CARTOES_ENDPOINT = '/cartao';

/** GET /cartao — listagem paginada. */
export function listCartoes(
  input: PaginatedInputDTO,
  signal?: AbortSignal,
): Promise<PaginatedResultDTO<CartaoDTO>> {
  const query = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  return apiRequest<PaginatedResultDTO<CartaoDTO>>(`${CARTOES_ENDPOINT}?${query.toString()}`, {
    signal,
  });
}

/**
 * GET /cartao/:id — consulta um cartão por id.
 *
 * Usada pelo fluxo de edição para carregar o cartão selecionado e pré-preencher
 * o formulário. O backend responde com o `CartaoDTO` (ou 404 se não existir).
 */
export function getCartao(id: string, signal?: AbortSignal): Promise<CartaoDTO> {
  return apiRequest<CartaoDTO>(`${CARTOES_ENDPOINT}/${id}`, { signal });
}

/**
 * POST /cartao — salva um cartão (criar/atualizar).
 *
 * O backend expõe um único endpoint "salvar": sem `id` no payload cria; com
 * `id` atualiza. A resposta é vazia (204/200 sem corpo), por isso retorna
 * `void`. Tanto o fluxo de criação quanto o de atualização passam por aqui.
 */
export function salvarCartao(payload: SalvarCartaoIn, signal?: AbortSignal): Promise<void> {
  return apiRequest<void>(CARTOES_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
}

/**
 * DELETE /cartao/:id — exclui um cartão de forma permanente.
 *
 * Usada pelo fluxo de exclusão a partir da listagem. O backend responde 204
 * sem corpo (ou 404 se o cartão não existir), por isso retorna `void`.
 */
export function excluirCartao(id: string, signal?: AbortSignal): Promise<void> {
  return apiRequest<void>(`${CARTOES_ENDPOINT}/${id}`, { method: 'DELETE', signal });
}
