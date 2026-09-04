import { CrudRepository } from '@arquitetura/shared';
import { Conta } from '../model';

export interface ContaRepository extends CrudRepository<Conta> {}
