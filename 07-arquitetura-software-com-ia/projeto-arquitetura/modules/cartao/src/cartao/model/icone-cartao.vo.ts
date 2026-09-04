import { Text } from '@arquitetura/shared';

export class IconeCartao extends Text {
  protected static override readonly TOO_SHORT: string = 'ICONE_CARTAO_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'ICONE_CARTAO_TOO_LONG';

  protected static override readonly DEFAULT_MIN_LENGTH = 1;
  protected static override readonly DEFAULT_MAX_LENGTH = 60;
}
