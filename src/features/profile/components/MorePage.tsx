"use client";

import "@/features/profile/profile.css";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAppStore } from "@/lib/app-store";

export function MorePage({ onToast }: { onToast: (message: string) => void }) {
  const { state, dispatch } = useAppStore();
  const [installPrompt, setInstallPrompt] = useState<{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(
        event as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> },
      );
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") onToast("Hambazi is installing.");
    setInstallPrompt(null);
  }
  const sections = [
    {
      label: "My profile",
      detail: "Your details, sports and reviews",
      icon: "user" as const,
      click: () => dispatch({ type: "OPEN_PROFILE", target: "mine" }),
    },
    {
      label: "Settings & privacy",
      detail: "Notifications, location and account",
      icon: "settings" as const,
      click: () => dispatch({ type: "NAVIGATE", screen: "settings" }),
    },
    {
      label: "Help & FAQ",
      detail: "Answers about joining and hosting",
      icon: "help" as const,
      click: () => dispatch({ type: "NAVIGATE", screen: "faq" }),
    },
    {
      label: "Saved matches",
      detail: `${state.savedMatchIds.length} games saved for later`,
      icon: "bookmark" as const,
      click: () => {
        dispatch({ type: "SET_MATCH_TAB", tab: "Saved matches" });
        dispatch({ type: "SET_MAIN_TAB", tab: "My Matches" });
      },
    },
  ];
  return (
    <section className="more-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1>More</h1>
        </div>
      </div>
      <button
        type="button"
        className="more-profile-card"
        onClick={() => dispatch({ type: "OPEN_PROFILE", target: "mine" })}
      >
        <Avatar name={state.profile.name} src={state.profile.avatar} size="lg" />
        <span>
          <strong>{state.profile.name}</strong>
          <small>{state.profile.username}</small>
        </span>
        <Icon name="chevronRight" />
      </button>
      <div className="more-menu-list">
        {sections.map((item) => (
          <button type="button" key={item.label} onClick={item.click}>
            <span className="more-menu-icon">
              <Icon name={item.icon} size={19} />
            </span>
            <span>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </span>
            <Icon name="chevronRight" size={17} />
          </button>
        ))}
      </div>
      <section className="install-card">
        <span className="install-symbol">
          h<span>.</span>
        </span>
        <div>
          <strong>{installed ? "Hambazi is installed" : "Take Hambazi with you"}</strong>
          <p>
            {installPrompt
              ? "Install for a quicker way to find your next game."
              : "Install from your browser menu for quick access."}
          </p>
        </div>
        {installPrompt && (
          <Button type="button" onClick={() => void install()}>
            Install
          </Button>
        )}
      </section>
      <p className="app-version">Hambazi · Community demo · 1.0</p>
      <Button
        type="button"
        variant="quiet"
        className="signout-button"
        onClick={() => {
          window.sessionStorage.removeItem("hambazi-demo-token");
          dispatch({ type: "SIGN_OUT" });
          onToast("You’ve signed out of this demo.");
        }}
      >
        <Icon name="logout" size={17} />
        Sign out
      </Button>
    </section>
  );
}
