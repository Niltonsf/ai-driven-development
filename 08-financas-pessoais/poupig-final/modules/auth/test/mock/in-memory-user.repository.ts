import { Result, TransactionContext } from '@poupig/shared'
import {
  User,
  UserRepository,
} from '../../../src/user'

export class InMemoryUserRepository
  implements UserRepository
{
  private readonly items = new Map<string, User>()

  async create(
    entity: User,
    _tx?: TransactionContext,
  ): Promise<Result<void>> {
    this.items.set(entity.id, entity)
    return Result.ok()
  }

  async update(
    entity: User,
    _tx?: TransactionContext,
  ): Promise<Result<void>> {
    this.items.set(entity.id, entity)
    return Result.ok()
  }

  async findById(id: string): Promise<Result<User>> {
    const entity = this.items.get(id)

    if (!entity) {
      return Result.fail('ENTITY_NOT_FOUND')
    }

    return Result.ok(entity)
  }

  async findByEmail(
    email: string,
    _tx?: TransactionContext,
  ): Promise<Result<User>> {
    const entity = [...this.items.values()].find((user) => user.email === email)

    if (!entity) {
      return Result.fail('ENTITY_NOT_FOUND')
    }

    return Result.ok(entity)
  }

  async delete(id: string, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.delete(id)
    return Result.ok()
  }
}
