export interface Page<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
}

export interface ProcessingSummary {
  id: string;
  ideaId: string;
  ideaName: string;
  ideaTypeName: string;
  iterationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingIterationView {
  id: string;
  refinement: string | null;
  result: string;
  position: number;
  createdAt: string;
}

export interface ProcessingResourceView {
  type: 'text';
  content: string;
  position: number;
}

export interface ProcessingDetail {
  id: string;
  ideaId: string;
  ideaName: string;
  ideaDescription: string;
  ideaObjective: string;
  ideaTypeId: string;
  ideaTypeName: string;
  resources: ProcessingResourceView[];
  iterations: ProcessingIterationView[];
  createdAt: string;
  updatedAt: string;
}

export interface IdeaSearchResult {
  id: string;
  name: string;
  ideaTypeId: string;
  ideaTypeName: string;
}

export interface StartProcessingInput {
  ideaId: string;
}

export interface RefineProcessingInput {
  refinement: string;
}
