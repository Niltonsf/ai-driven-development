import { PageResult } from "@ideias/shared";
import { DailyCount } from "../../idea/provider/idea.repository";
import { Processing, ProcessingIteration } from "../model";

export interface ProcessingPageParams {
  userId: string;
  page: number;
  perPage: number;
}

// Tipo de leitura dedicado para a listagem paginada: a tabela so precisa do
// snapshot basico + contagem de iteracoes, entao nao carregamos a colecao
// completa de iteracoes/recursos (payload de listagem enxuto, mesmo espirito
// do findPage da spec 007).
export interface ProcessingSummary {
  id: string;
  ideaId: string;
  ideaName: string;
  ideaTypeName: string;
  iterationsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IdeaSearchParams {
  userId: string;
  term: string;
}

export interface IdeaSearchResult {
  id: string;
  name: string;
  ideaTypeId: string;
  ideaTypeName: string;
}

// O ProcessingRepository e a fronteira de persistencia do agregado processing.
// Nao estende CrudRepository porque o ciclo de vida e diferente: o agregado so
// evolui por append de iteracao (nunca update) ou exclusao.
export interface ProcessingRepository {
  // Persiste o agregado completo (Processing + iteracoes + snapshot de
  // recursos) atomicamente.
  create(entity: Processing): Promise<Processing>;
  // Anexa uma nova iteracao ao Processamento existente sem tocar nas
  // anteriores.
  appendIteration(
    processingId: string,
    iteration: ProcessingIteration,
  ): Promise<void>;
  // Apaga Processamento e suas iteracoes (cascata garantida no banco).
  delete(id: string): Promise<void>;
  // Carrega o Processamento com iteracoes e recursos ordenados por
  // position ASC. Sem filtro por userId (o filtro fica no caso de uso/
  // controller, mesmo padrao da spec 007).
  findById(id: string): Promise<Processing | null>;
  // Listagem paginada com tipo de leitura ProcessingSummary
  // (iteracoes nao vem completas, apenas a contagem).
  findPage(params: ProcessingPageParams): Promise<PageResult<ProcessingSummary>>;
  // Busca para o combobox de Ideia (limite fixo de 20, sem paginacao).
  searchIdeas(params: IdeaSearchParams): Promise<IdeaSearchResult[]>;
  // Total de Processamentos do usuario (card de estatistica do dashboard).
  countByUser(userId: string): Promise<number>;
  // Processamentos criados por dia (createdAt, UTC) na janela
  // [hoje-(days-1) .. hoje]. Pode retornar apenas dias com registro.
  countDailyByUser(userId: string, days: number): Promise<DailyCount[]>;
}
