/**
 * Query string conversions shared by the controllers of the module that read
 * movements (`/transactions` and `/statement`), so a flag means the same thing
 * in both.
 */

/** Only `'true'` or `'1'` turn a query flag on; any other value means "no filter". */
export function parseBooleanFlag(value?: string): true | undefined {
  return value === 'true' || value === '1' ? true : undefined;
}
