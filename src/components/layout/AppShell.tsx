"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/layout/BottomNav";
import type { MainTab, Screen } from "@/lib/domain";

export function AppShell({
  children,
  screen,
  activeTab,
  location,
  profile,
  pendingRequestCount,
  isOnline,
  onNavigate,
  onRequests,
  onProfile,
  onLocation,
  onCreate,
}: {
  children: React.ReactNode;
  screen: Screen;
  activeTab: MainTab;
  location: string;
  profile: { name: string; avatar?: string };
  pendingRequestCount: number;
  isOnline: boolean;
  onNavigate: (tab: MainTab) => void;
  onRequests: () => void;
  onProfile: () => void;
  onLocation: (city: string) => void;
  onCreate: () => void;
}) {
  const [locationOpen, setLocationOpen] = useState(false);
  const mainScreen = ["home", "matches", "messages", "more"].includes(screen);
  const cities = ["London", "Liverpool", "Bristol"];

  return (
    <div className={`app-shell ${mainScreen ? "app-shell-main" : "app-shell-flow"}`}>
      {!isOnline && (
        <div className="offline-banner">
          <span className="offline-dot" />
          Offline mode · saved games are still available
        </div>
      )}
      {mainScreen && (
        <header className="topbar">
          <a
            href="#home"
            className="brand"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("Home");
            }}
            aria-label="Hambazi home"
          >
            <span className="brand-mark">
              h<span>.</span>
            </span>
            <span>hambazi</span>
          </a>
          <div className="topbar-right">
            <div className="location-wrap">
              <button
                type="button"
                className="location-button"
                aria-expanded={locationOpen}
                onClick={() => setLocationOpen(!locationOpen)}
              >
                <Icon name="pin" size={18} />
                <span>{location}</span>
                <Icon name="chevronDown" size={15} />
              </button>
              {locationOpen && (
                <div className="location-menu" role="menu" aria-label="Choose city">
                  <p>Choose your city</p>
                  {cities.map((city) => (
                    <button
                      role="menuitem"
                      type="button"
                      key={city}
                      onClick={() => {
                        onLocation(city);
                        setLocationOpen(false);
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="icon-button header-bell"
              aria-label={`Open match requests${pendingRequestCount ? ` (${pendingRequestCount} pending)` : ""}`}
              onClick={onRequests}
            >
              <Icon name="bell" size={21} />
              {pendingRequestCount > 0 && <span className="notification-dot" />}
            </button>
            <button
              type="button"
              className="header-avatar-button"
              aria-label={`Open ${profile.name}'s profile`}
              onClick={onProfile}
            >
              <Avatar name={profile.name} src={profile.avatar} size="sm" />
            </button>
          </div>
        </header>
      )}
      <main className="page-content" id="main-content">
        {children}
      </main>
      {mainScreen && <BottomNav active={activeTab} onSelect={onNavigate} />}
      {mainScreen && (
        <button type="button" className="create-fab" onClick={onCreate} aria-label="Create a match">
          <Icon name="plus" size={23} />
          <span>Create match</span>
        </button>
      )}
    </div>
  );
}
