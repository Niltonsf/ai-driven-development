/**
 * Read projection of one slice of the category spending report: how much went
 * out of one subcategory in the period, with the appearance of the subcategory
 * and of the category that owns it. Only the totals, never the transactions
 * behind them.
 *
 * - There is a row only for who had spending in the period: the report shows
 *   what was spent, not the catalog. An inactive or soft deleted category or
 *   subcategory with spending is present with its own name, otherwise the rows
 *   would not add up to the total spent.
 * - The fields of identity are `null` together, and only in the single row of
 *   the unclassified bucket (outflows without subcategory, or whose subcategory
 *   appearance was not found). Outside that row, category and subcategory are
 *   always filled: a subcategory never exists without its category. They are
 *   `null`, and not optional as in `CategoryDTO`, because the absence is explicit.
 * - The list comes ordered by `total` descending, then by the category name and
 *   by the subcategory name (`pt-BR` collation), with the unclassified bucket
 *   last on a tie. The consumer never sorts again.
 */
export type CategorySpendingSliceDTO = {
  /** Id of the category that owns the subcategory; `null` only in the unclassified bucket. */
  categoryId: string | null;
  /** Name of the category, even when inactive or soft deleted; `null` only in the unclassified bucket. */
  categoryName: string | null;
  /** Color of the category as stored (may be `null`): the effective color is derived by the display. */
  categoryColor: string | null;
  /** Icon key of the category as stored (may be `null`). */
  categoryIcon: string | null;
  /** Id of the subcategory; `null` only in the unclassified bucket. */
  subcategoryId: string | null;
  /** Name of the subcategory, even when inactive or soft deleted; `null` only in the unclassified bucket. */
  subcategoryName: string | null;
  /** Color of the subcategory as stored (may be `null`): the effective color is derived by the display. */
  subcategoryColor: string | null;
  /** Icon key of the subcategory as stored (may be `null`). */
  subcategoryIcon: string | null;
  /**
   * Sum of the outflows of the subcategory in the period, in reais, with at
   * most two decimals and always positive (it is a magnitude of spending):
   * standalone transactions, stored occurrences and generated occurrences.
   */
  total: number;
};
