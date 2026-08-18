import { PageResult } from "@sdd/shared";
import { User, UserPageParams, UserRepository } from "../../src/user";

export class FakeUserRepository implements UserRepository {
  readonly users: User[] = [];

  async create(data: User): Promise<User> {
    this.users.push(data);
    return data;
  }

  async update(data: User): Promise<User> {
    const index = this.users.findIndex((u) => u.id === data.id);
    if (index >= 0) this.users[index] = data;
    return data;
  }

  async delete(id: string): Promise<void> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index >= 0) this.users.splice(index, 1);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findPage(params: UserPageParams): Promise<PageResult<User>> {
    const start = (params.page - 1) * params.perPage;
    const items = this.users.slice(start, start + params.perPage);
    return { items, total: this.users.length, page: params.page, perPage: params.perPage };
  }
}
