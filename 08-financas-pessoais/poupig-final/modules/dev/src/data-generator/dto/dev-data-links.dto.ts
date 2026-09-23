/**
 * How many accounts and credit cards the plan can link to.
 * Only counts — never ids or names — so the planner stays independent of the
 * database state and of other modules.
 */
export type DevDataLinksDTO = {
  accountCount: number;
  creditCardCount: number;
};
