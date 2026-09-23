export type SubcategoryDTO = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryDTO = {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  subcategories: SubcategoryDTO[];
  createdAt: Date;
  updatedAt: Date;
};
