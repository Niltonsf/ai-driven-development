"use client";

/**
 * Menu divider — separador horizontal opcional no menu.
 * O template original não usa divisores explícitos no sidebar (grupos são
 * separados por margens via `--adminMenu-groupSpacing`); ainda assim
 * exportamos o componente porque o tipo `MenuDivider` é parte do contrato
 * que a skill `pages` consome.
 */
export function MenuDivider() {
  return (
    <li
      role="separator"
      aria-hidden="true"
      style={{
        height: "1px",
        margin: "0.5rem 0",
        background: "var(--adminMenu-divider)",
        listStyle: "none",
      }}
    />
  );
}
