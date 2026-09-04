// Schema de validação do formulário de contas.
//
// Reutiliza os Value Objects do domínio (`@arquitetura/contas` e
// `@arquitetura/shared`) como fonte única de verdade das regras de validação —
// os mesmos VOs usados pelo backend validam o formulário no cliente, evitando
// duplicação de limites/mensagens. O schema é agnóstico de operação: descreve a
// FORMA da conta; a decisão criação vs. edição vem do DTO (ver helpers abaixo).

import { HexColor } from '@arquitetura/shared';
import type { ContaDTO } from '@arquitetura/contas';
import type { SalvarContaIn } from '@arquitetura/contas';
import {
  AgenciaConta,
  DescricaoConta,
  IconeConta,
  InstituicaoConta,
  NomeConta,
  NumeroConta,
} from '@arquitetura/contas';
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
 * Schema do formulário de conta. Apenas `name` e `active` são obrigatórios;
 * os demais campos são opcionais e, quando vazios, são omitidos do payload.
 */
export const contaFormSchema = v.defineObject({
  name: NomeConta,
  institutionName: { vo: InstituicaoConta, optional: true },
  agency: { vo: AgenciaConta, optional: true },
  accountNumber: { vo: NumeroConta, optional: true },
  description: { vo: DescricaoConta, optional: true },
  color: { vo: HexColor, optional: true },
  icon: { vo: IconeConta, optional: true },
  active: BooleanFlag,
});

/** Modelo tipado do formulário, inferido diretamente do schema. */
export type ContaFormData = v.infer<typeof contaFormSchema>;

/**
 * Valores iniciais do formulário.
 *
 * - Sem DTO (ou DTO vazio) → modo criação: campos em branco e conta ativa.
 * - Com DTO → modo edição: campos pré-preenchidos a partir da conta existente.
 *
 * Os opcionais usam `''` (e não `undefined`) para manterem os inputs
 * controlados; o resolver converte string vazia em campo omitido.
 */
export function toContaFormDefaults(conta?: ContaDTO): ContaFormData {
  return {
    name: conta?.name ?? '',
    institutionName: conta?.institutionName ?? '',
    agency: conta?.agency ?? '',
    accountNumber: conta?.accountNumber ?? '',
    description: conta?.description ?? '',
    color: conta?.color ?? '',
    icon: conta?.icon ?? '',
    active: conta?.active ?? true,
  };
}

/**
 * Monta o payload enviado ao backend a partir dos dados já validados.
 *
 * O `id` não é editável e não pertence ao formulário: vem do DTO original.
 * Ausência de `id` ⇒ criação; presença ⇒ atualização (o backend decide via
 * mesmo endpoint `POST /contas`). É aqui que o fluxo de edição se conecta no
 * futuro — sem nenhuma mudança no schema nem no componente.
 */
export function toSalvarContaPayload(data: ContaFormData, conta?: ContaDTO): SalvarContaIn {
  return {
    ...(conta?.id ? { id: conta.id } : {}),
    name: data.name,
    institutionName: data.institutionName,
    agency: data.agency,
    accountNumber: data.accountNumber,
    description: data.description,
    color: data.color,
    icon: data.icon,
    active: data.active,
  };
}
