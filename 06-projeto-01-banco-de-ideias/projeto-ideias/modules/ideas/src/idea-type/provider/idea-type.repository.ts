import { CrudRepository } from "@ideias/shared";
import { IdeaType } from "../model";

export interface IdeaTypePageParams {
  userId: string;
  page: number;
  perPage: number;
}

export interface IdeaTypeRepository extends CrudRepository<
  IdeaType,
  IdeaType,
  IdeaType,
  IdeaTypePageParams
> {
  // Total de Tipos de Ideia do usuario (card de estatistica do dashboard).
  countByUser(userId: string): Promise<number>;
}
