import { AccountType } from '../model/account-type.enum';

export type AccountDTO = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: AccountType;
  accountNumber?: string;
  agency?: string;
  financialInstitution?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
