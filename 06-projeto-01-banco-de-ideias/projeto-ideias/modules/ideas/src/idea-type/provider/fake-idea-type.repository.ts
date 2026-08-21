import { PageResult } from "@ideias/shared";
import { IdeaType } from "../model";
import {
  IdeaTypePageParams,
  IdeaTypeRepository,
} from "./idea-type.repository";

export class FakeIdeaTypeRepository implements IdeaTypeRepository {
  private items: IdeaType[] = [];

  async create(entity: IdeaType): Promise<IdeaType> {
    this.items.push(entity);
    return entity;
  }

  async update(entity: IdeaType): Promise<IdeaType> {
    const index = this.items.findIndex((item) => item.id === entity.id);
    if (index === -1) {
      this.items.push(entity);
    } else {
      this.items[index] = entity;
    }
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id);
  }

  async findById(id: string): Promise<IdeaType | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async countByUser(userId: string): Promise<number> {
    return this.items.filter((item) => item.userId === userId).length;
  }

  async findPage(params: IdeaTypePageParams): Promise<PageResult<IdeaType>> {
    const filtered = this.items.filter(
      (item) => item.userId === params.userId,
    );
    const page = Math.max(params.page, 1);
    const perPage = Math.max(params.perPage, 1);
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);
    return {
      items,
      page,
      perPage,
      total: filtered.length,
    };
  }
}
