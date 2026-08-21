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
  updatedAt: string;
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
