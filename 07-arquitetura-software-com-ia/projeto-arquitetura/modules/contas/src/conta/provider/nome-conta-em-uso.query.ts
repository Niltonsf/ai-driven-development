import { Result } from '@arquitetura/shared';

export interface NomeContaEmUsoInput {
  name: string;
  ignoreId?: string;
}

export interface NomeContaEmUsoQuery {
  execute(input: NomeContaEmUsoInput): Promise<Result<boolean>>;
}
