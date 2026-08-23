export interface NavItem {
  readonly label: string;
  readonly href: string;
}

/** Sidebar links. Add future pages (History, Settings, ...) here — never inline in a component. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Profile", href: "/profile" },
];
