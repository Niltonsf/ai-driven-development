import { Text } from '@arquitetura/shared';

export class DescricaoConta extends Text {
  protected static override readonly TOO_SHORT: string = 'DESCRICAO_CONTA_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'DESCRICAO_CONTA_TOO_LONG';

  protected static override readonly DEFAULT_MIN_LENGTH = 8;
  protected static override readonly DEFAULT_MAX_LENGTH = 256;
}
