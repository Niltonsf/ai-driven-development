import { DevDataPeriodDTO } from './dev-data-period.dto';
import { TransactionSeriesBlueprint } from './transaction-series-blueprint.dto';

/**
 * Everything one run of the series generator will create. `series` lists the
 * recurrences first and the installment plans after them; `kind` tells them
 * apart. Nothing is persisted and no occurrence is planned here: the backend
 * computes the occurrences from each saved series. The `seed` reproduces the plan.
 */
export type SeriesDataPlanDTO = {
  series: TransactionSeriesBlueprint[];
  seed: number;
  period: DevDataPeriodDTO;
};
