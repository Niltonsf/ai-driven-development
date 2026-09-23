/**
 * Frontend switch of the development tools (the `Extras` menu section and the
 * `/dev` screen). The single place that reads the variable: layout and page
 * import this constant.
 *
 * Next.js inlines `NEXT_PUBLIC_*` values at build time, so the literal
 * comparison below is required and changing the value needs a restart/rebuild.
 * Production does not define the variable, which keeps the feature off. Hiding
 * the menu is not protection: the backend answers `404` when its own switch is off.
 */
export const DEV_TOOLS_ENABLED = process.env.NEXT_PUBLIC_DEV_TOOLS_ENABLED === 'true';
