import { CrudRepository, Result, TransactionContext } from '@poupig/shared'
import { User } from '../model'

export interface UserRepository extends CrudRepository<User> {
  findByEmail(email: string, tx?: TransactionContext): Promise<Result<User>>
}
