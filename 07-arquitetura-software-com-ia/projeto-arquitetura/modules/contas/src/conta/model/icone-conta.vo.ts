import { Text } from '@arquitetura/shared';

export class IconeConta extends Text {
  protected static override readonly TOO_SHORT: string = 'ICONE_CONTA_TOO_SHORT';
  protected static override readonly TOO_LONG: string = 'ICONE_CONTA_TOO_LONG';

  protected static override readonly DEFAULT_MIN_LENGTH = 1;
  protected static override readonly DEFAULT_MAX_LENGTH = 60;
}
