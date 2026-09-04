import { CrudRepository } from '@arquitetura/shared';
import { Cartao } from '../model';

export interface CartaoRepository extends CrudRepository<Cartao> {}
