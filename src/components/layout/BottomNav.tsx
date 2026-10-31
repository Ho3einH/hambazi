"use client";

import { Icon } from "@/components/ui/Icon";
import type { MainTab } from "@/lib/domain";

const items: { tab: MainTab; icon: "home" | "trophy" | "messages" | "menu" }[] = [
  { tab: "Home", icon: "home" },
  { tab: "My Matches", icon: "trophy" },
  { tab: "Messages", icon: "messages" },
  { tab: "More", icon: "menu" },
];

export function BottomNav({
  active,
  onSelect,
}: {
  active: MainTab;
  onSelect: (tab: MainTab) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map(({ tab, icon }) => (
        <button
          type="button"
          key={tab}
          className={`bottom-nav-item ${active === tab ? "is-active" : ""}`}
          aria-current={active === tab ? "page" : undefined}
          onClick={() => onSelect(tab)}
        >
          <Icon name={icon} size={22} strokeWidth={active === tab ? 2.5 : 1.9} />
          <span>{tab}</span>
        </button>
      ))}
    </nav>
  );
}
