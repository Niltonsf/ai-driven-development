import { User, UserPageParams, UserRepository } from "../../src/user";

export class FakeUserRepository implements UserRepository {
  readonly createdUsers: User[] = [];
  readonly updatedUsers: User[] = [];
  readonly deletedIds: string[] = [];
  private store: User[] = [];

  async create(entity: User): Promise<User> {
    this.createdUsers.push(entity);
    this.store.push(entity);
    return entity;
  }

  async update(entity: User): Promise<User> {
    this.updatedUsers.push(entity);
    const index = this.store.findIndex((item) => item.id === entity.id);
    if (index >= 0) {
      this.store[index] = entity;
    }
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.deletedIds.push(id);
    this.store = this.store.filter((item) => item.id !== id);
  }

  async findById(id: string): Promise<User | null> {
    return this.store.find((item) => item.id === id) ?? null;
  }

  async findPage(params: UserPageParams) {
    return {
      items: this.store.slice(),
      total: this.store.length,
      page: params.page,
      perPage: params.perPage,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.store.find((item) => item.email === email) ?? null;
  }

  seed(user: User): void {
    this.store.push(user);
  }
}
