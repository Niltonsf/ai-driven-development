import { Text } from '@arquitetura/shared';

export class InstituicaoConta extends Text {
  protected static override readonly TOO_SHORT: string = 'INSTITUICAO_CONTA_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'INSTITUICAO_CONTA_TOO_LONG';

  protected static override readonly DEFAULT_MIN_LENGTH = 2;
  protected static override readonly DEFAULT_MAX_LENGTH = 120;
}
