import { Result } from '@arquitetura/shared';

export interface NomeCartaoEmUsoInput {
  name: string;
  ignoreId?: string;
}

export interface NomeCartaoEmUsoQuery {
  execute(input: NomeCartaoEmUsoInput): Promise<Result<boolean>>;
}
