import { CardBrand } from '../model/card-brand.enum';

export type CreditCardDTO = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  brand: CardBrand;
  lastFourDigits?: string;
  closingDay: number;
  dueDay: number;
  limit?: number;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
