import { Text } from '@arquitetura/shared';

export class NomeCartao extends Text {
  protected static override readonly TOO_SHORT: string = 'NOME_CARTAO_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'NOME_CARTAO_TOO_LONG';

  protected static override readonly DEFAULT_MIN_LENGTH = 3;
  protected static override readonly DEFAULT_MAX_LENGTH = 80;
}
