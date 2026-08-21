// DTOs de leitura do dashboard. O agregado dashboard e somente leitura:
// nao tem entidade propria, repositorio com mutacao nem persistencia.

export interface DashboardStats {
  ideasCount: number;
  ideaTypesCount: number;
  processingsCount: number;
}

export interface DashboardIdeaSummary {
  id: string;
  name: string;
  ideaTypeId: string;
  ideaTypeName: string;
  updatedAt: Date;
}

export interface DashboardActivityPoint {
  date: string;
  ideasCreated: number;
  processingsExecuted: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  latestIdeas: DashboardIdeaSummary[];
  activity: DashboardActivityPoint[];
}
