/**
 * Tipos da topbar — extraídos fielmente do template demo.tailadmin.com.
 * Apenas estrutura visual; nenhuma ação real (theme/search/menu items são stubs).
 */

export type TopbarNotification = {
  id: string;
  avatarSrc: string;
  statusColor: "success" | "error";
  actorName: string;
  message: string;
  projectName: string;
  category: string;
  timeAgo: string;
};

export type TopbarUserMenuItem = {
  id: string;
  label: string;
  href?: string;
  iconKey: "edit-profile" | "account-settings" | "support";
};

export type TopbarUserConfig = {
  avatarSrc: string;
  shortName: string;
  fullName: string;
  email: string;
  menuItems: TopbarUserMenuItem[];
};

export type TopbarSearchConfig = {
  placeholder: string;
  shortcut: { primary: string; secondary: string };
};

export type TopbarConfig = {
  search: TopbarSearchConfig;
  notifications: TopbarNotification[];
  user: TopbarUserConfig;
  brand: {
    logoSrc: string;
    logoDarkSrc: string;
    href: string;
    alt: string;
  };
};
