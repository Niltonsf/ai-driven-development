import { CrudRepository } from '@poupig/shared'
import { Password } from '../model'

export interface PasswordRepository
  extends CrudRepository<Password> {}
