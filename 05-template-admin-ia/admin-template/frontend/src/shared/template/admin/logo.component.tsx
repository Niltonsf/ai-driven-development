"use client";

import { useMenuState } from "./use-menu-state.hook";

type LogoProps = {
  /* "aside" (default): escolhe entre `full` e `icon` conforme o estado do menu (`mini` → icon).
   * "topbar":          usa o asset `mobile` se existir; senão `full`. */
  placement?: "aside" | "topbar";
};

export function Logo({ placement = "aside" }: LogoProps = {}) {
  const { mode, isMobile } = useMenuState();
  const isMini = !isMobile && mode === "mini";

  const src =
    placement === "topbar"
      ? "/template/admin/logo/logo-8ed3242df5.svg"
      : isMini
        ? "/template/admin/logo/logo-icon-7ee79f8eaf.svg"
        : "/template/admin/logo/logo-8ed3242df5.svg";

  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <img
        src={src}
        alt="TailAdmin"
        style={{ height: "32px", width: "auto", display: "block" }}
      />
    </span>
  );
}
