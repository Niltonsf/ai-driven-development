import { CrudRepository } from "@ideias/shared";
import { Idea } from "../model";

export interface IdeaPageParams {
  userId: string;
  page: number;
  perPage: number;
}

// Leitura enxuta para a lista do dashboard: so o necessario para renderizar a
// linha, sem carregar a Idea completa nem seus recursos.
export interface IdeaSummary {
  id: string;
  name: string;
  ideaTypeId: string;
  ideaTypeName: string;
  updatedAt: Date;
}

// Contagem diaria compartilhada pelas leituras de atividade do dashboard
// (Idea e Processing). date e a data UTC truncada (YYYY-MM-DD). Definido uma
// unica vez aqui e reexportado pelo modulo.
export interface DailyCount {
  date: string;
  count: number;
}

// O IdeaRepository e a fronteira de persistencia do agregado idea: recebe e
// devolve a Idea com sua colecao de Resource materializada.
// - create: persiste a Idea e os recursos vindos em entity.resources.
// - update: recebe a colecao final de recursos e reconcilia (replace-all)
//   dentro de transacao — apaga os ausentes, cria os novos, atualiza os
//   existentes (vide Observacoes Locais da spec 009).
// - delete: a remocao em cascata dos recursos fica na FK do banco.
// - findById: carrega os recursos ordenados por position ASC, createdAt ASC.
// - findPage: NAO carrega recursos (payload de listagem enxuto).
export interface IdeaRepository extends CrudRepository<
  Idea,
  Idea,
  Idea,
  IdeaPageParams
> {
  // Total de Ideias do usuario (card de estatistica do dashboard).
  countByUser(userId: string): Promise<number>;
  // Ultimas Ideias atualizadas (updatedAt desc), payload enxuto.
  findLatestByUser(userId: string, limit: number): Promise<IdeaSummary[]>;
  // Ideias criadas por dia (createdAt, UTC) na janela [hoje-(days-1) .. hoje].
  // Pode retornar apenas dias com registro; o caso de uso preenche o resto.
  countDailyByUser(userId: string, days: number): Promise<DailyCount[]>;
}
