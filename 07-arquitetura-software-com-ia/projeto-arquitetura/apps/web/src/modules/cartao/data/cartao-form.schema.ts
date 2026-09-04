// Schema de validação do formulário de cartões.
//
// Reutiliza os Value Objects do domínio (`@arquitetura/cartao` e
// `@arquitetura/shared`) como fonte única de verdade das regras de validação —
// os mesmos VOs usados pelo backend validam o formulário no cliente, evitando
// duplicação de limites/mensagens. O schema é agnóstico de operação: descreve a
// FORMA do cartão; a decisão criação vs. edição vem do DTO (ver helpers abaixo).

import { DayOfMonth, HexColor, NonNegative } from '@arquitetura/shared';
import type { CartaoDTO, SalvarCartaoIn } from '@arquitetura/cartao';
import {
  BandeiraCartao,
  DescricaoCartao,
  IconeCartao,
  NomeCartao,
  UltimosDigitosCartao,
} from '@arquitetura/cartao';
import { v } from '@/shared/components/form/validator';

// `active` é um booleano sem regra de domínio. O validator opera sobre Value
// Objects (`tryCreate`), então adaptamos a flag a esse contrato mínimo para que
// ela atravesse o resolver e participe do tipo inferido como `boolean`.
const BooleanFlag = {
  tryCreate(value: boolean) {
    return { isFailure: false, isOk: true, instance: { value: Boolean(value) } };
  },
};

/**
 * Adapta um VO numérico do domínio (que valida um `number`) ao formulário, cujos
 * inputs entregam `string`. Converte a string na fronteira e delega a validação
 * ao VO (herdando suas regras/mensagens). Mantém a STRING original no estado do
 * RHF — a conversão para `number` do payload acontece em `toSalvarCartaoPayload`,
 * evitando `NaN` e mantendo os inputs controlados.
 *
 * Campos vazios já são omitidos pelo resolver (string vazia ⇒ campo ausente),
 * então aqui só chegam strings com conteúdo.
 */
function numericField(vo: { tryCreate(value: number): { isFailure: boolean; errors?: string[] } }) {
  return {
    tryCreate(value: string) {
      const parsed = Number(String(value).trim());
      if (!Number.isFinite(parsed)) {
        return { isFailure: true, isOk: false, errors: ['NUMBER_INVALID'] };
      }

      const result = vo.tryCreate(parsed);
      if (result.isFailure) {
        return { isFailure: true, isOk: false, errors: result.errors };
      }

      return { isFailure: false, isOk: true, instance: { value: String(value).trim() } };
    },
  };
}

/**
 * Schema do formulário de cartão. Apenas `name` e `active` são obrigatórios;
 * os demais campos são opcionais e, quando vazios, são omitidos do payload.
 */
export const cartaoFormSchema = v.defineObject({
  name: NomeCartao,
  description: { vo: DescricaoCartao, optional: true },
  flag: { vo: BandeiraCartao, optional: true },
  lastDigits: { vo: UltimosDigitosCartao, optional: true },
  limit: { vo: numericField(NonNegative), optional: true },
  closingDay: { vo: numericField(DayOfMonth), optional: true },
  dueDay: { vo: numericField(DayOfMonth), optional: true },
  color: { vo: HexColor, optional: true },
  icon: { vo: IconeCartao, optional: true },
  active: BooleanFlag,
});

/** Modelo tipado do formulário, inferido diretamente do schema. */
export type CartaoFormData = v.infer<typeof cartaoFormSchema>;

/** Converte um número opcional do DTO em string para um input controlado. */
function toInputString(value?: number): string {
  return value === undefined || value === null ? '' : String(value);
}

/**
 * Valores iniciais do formulário.
 *
 * - Sem DTO (ou DTO vazio) → modo criação: campos em branco e cartão ativo.
 * - Com DTO → modo edição: campos pré-preenchidos a partir do cartão existente.
 *
 * Os opcionais usam `''` (e não `undefined`) para manterem os inputs
 * controlados; o resolver converte string vazia em campo omitido. Os numéricos
 * são serializados para string (a conversão de volta vive no payload).
 */
export function toCartaoFormDefaults(cartao?: CartaoDTO): CartaoFormData {
  return {
    name: cartao?.name ?? '',
    description: cartao?.description ?? '',
    flag: cartao?.flag ?? '',
    lastDigits: cartao?.lastDigits ?? '',
    limit: toInputString(cartao?.limit),
    closingDay: toInputString(cartao?.closingDay),
    dueDay: toInputString(cartao?.dueDay),
    color: cartao?.color ?? '',
    icon: cartao?.icon ?? '',
    active: cartao?.active ?? true,
  };
}

/** Converte uma string numérica validada em número; vazio ⇒ omitido. */
function toNumber(value?: string): number | undefined {
  if (value === undefined || String(value).trim() === '') return undefined;
  return Number(value);
}

/**
 * Monta o payload enviado ao backend a partir dos dados já validados.
 *
 * O `id` não é editável e não pertence ao formulário: vem do DTO original.
 * Ausência de `id` ⇒ criação; presença ⇒ atualização (o backend decide via
 * mesmo endpoint `POST /cartoes`). Os campos numéricos são convertidos para
 * `number` aqui — a fronteira do form — e os opcionais vazios são omitidos.
 */
export function toSalvarCartaoPayload(data: CartaoFormData, cartao?: CartaoDTO): SalvarCartaoIn {
  return {
    ...(cartao?.id ? { id: cartao.id } : {}),
    name: data.name,
    ...(data.description ? { description: data.description } : {}),
    ...(data.flag ? { flag: data.flag } : {}),
    ...(data.lastDigits ? { lastDigits: data.lastDigits } : {}),
    ...(toNumber(data.limit) !== undefined ? { limit: toNumber(data.limit) } : {}),
    ...(toNumber(data.closingDay) !== undefined ? { closingDay: toNumber(data.closingDay) } : {}),
    ...(toNumber(data.dueDay) !== undefined ? { dueDay: toNumber(data.dueDay) } : {}),
    ...(data.color ? { color: data.color } : {}),
    ...(data.icon ? { icon: data.icon } : {}),
    active: data.active,
  };
}
