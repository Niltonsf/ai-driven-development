import { Text } from '@arquitetura/shared';

export class NomeConta extends Text {
  protected static override readonly TOO_SHORT: string = 'NOME_CONTA_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'NOME_CONTA_TOO_LONG';

  protected static override readonly DEFAULT_MIN_LENGTH = 3;
  protected static override readonly DEFAULT_MAX_LENGTH = 80;
}
