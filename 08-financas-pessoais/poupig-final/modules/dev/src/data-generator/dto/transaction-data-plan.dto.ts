import { AccountBlueprint } from './account-blueprint.dto';
import { CreditCardBlueprint } from './credit-card-blueprint.dto';
import { DevDataPeriodDTO } from './dev-data-period.dto';
import { TransactionBlueprint } from './transaction-blueprint.dto';

/**
 * Everything one run of the one-off transaction generator will create, in
 * dependency order. Nothing is persisted: the plan is the product of the
 * domain, and the `seed` reproduces it.
 */
export type TransactionDataPlanDTO = {
  accounts: AccountBlueprint[];
  creditCards: CreditCardBlueprint[];
  transactions: TransactionBlueprint[];
  seed: number;
  period: DevDataPeriodDTO;
};
