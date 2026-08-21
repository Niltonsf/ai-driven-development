import { PageResult } from "@ideias/shared";
import { User, UserPageParams, UserRepository } from "../../src";

export class FakeUserRepository implements UserRepository {
  public users: User[];
  public createdUsers: User[] = [];

  constructor(initial: User[] = []) {
    this.users = [...initial];
  }

  async create(entity: User): Promise<User> {
    this.users.push(entity);
    this.createdUsers.push(entity);
    return entity;
  }

  async update(entity: User): Promise<User> {
    const index = this.users.findIndex((u) => u.id === entity.id);
    if (index >= 0) this.users[index] = entity;
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findPage(params: UserPageParams): Promise<PageResult<User>> {
    return {
      items: this.users,
      total: this.users.length,
      page: params.page,
      perPage: params.perPage,
    };
  }
}
