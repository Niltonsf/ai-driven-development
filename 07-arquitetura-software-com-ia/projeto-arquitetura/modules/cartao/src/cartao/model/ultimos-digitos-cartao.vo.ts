import { Text } from '@arquitetura/shared';

export class UltimosDigitosCartao extends Text {
  protected static override readonly TOO_SHORT: string = 'ULTIMOS_DIGITOS_CARTAO_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'ULTIMOS_DIGITOS_CARTAO_TOO_LONG';

  protected static override readonly DEFAULT_MIN_LENGTH = 1;
  protected static override readonly DEFAULT_MAX_LENGTH = 4;
}
