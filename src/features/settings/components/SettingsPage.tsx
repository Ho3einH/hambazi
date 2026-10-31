"use client";

import "@/features/settings/settings.css";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { AppState, Preferences } from "@/lib/domain";
import { useAppStore } from "@/lib/app-store";

const preferenceRows: { key: keyof Preferences; title: string; description: string }[] = [
  {
    key: "essential",
    title: "Essential",
    description: "This saved demo preference stays on. Push alerts are not connected.",
  },
  {
    key: "personalized",
    title: "Personalized",
    description: "Saved demo preference only; reminders and notifications are not sent.",
  },
  {
    key: "marketing",
    title: "Marketing",
    description: "Saved demo preference only; news and offers are not sent.",
  },
  {
    key: "approximateLocation",
    title: "Approximate location",
    description:
      "Allows one-time approximate city lookup. Precise coordinates aren’t stored; push alerts are not connected.",
  },
];

export function SettingsPage({
  state,
  onToast,
  onBack,
}: {
  state: AppState;
  onToast: (message: string) => void;
  onBack: () => void;
}) {
  const { dispatch } = useAppStore();
  const [showBlocked, setShowBlocked] = useState(false);
  const [saved, setSaved] = useState(false);
  function update(key: keyof Preferences, value: boolean) {
    dispatch({ type: "UPDATE_PREFERENCE", key, value });
    setSaved(false);
  }
  function confirmDelete() {
    if (!window.confirm("Reset all Hambazi demo data stored in this browser?")) return;
    window.localStorage.removeItem("hambazi-app-v2");
    window.sessionStorage.removeItem("hambazi-demo-token");
    dispatch({ type: "RESET_TO_WELCOME" });
    onToast("Demo data was reset on this device.");
  }

  return (
    <section className="settings-page">
      <header className="flow-header">
        <button type="button" className="icon-button" aria-label="Back to profile" onClick={onBack}>
          <Icon name="arrowLeft" />
        </button>
        <h1>Settings</h1>
        <span />
      </header>
      <div className="settings-content">
        <section className="settings-group">
          <h2>Notifications</h2>
          {preferenceRows.slice(0, 3).map((item) => (
            <PreferenceRow
              key={item.key}
              item={item}
              value={state.preferences[item.key]}
              onToggle={() => update(item.key, !state.preferences[item.key])}
            />
          ))}
        </section>
        <section className="settings-group">
          <h2>Privacy</h2>
          <PreferenceRow
            item={preferenceRows[3]}
            value={state.preferences.approximateLocation}
            onToggle={() => update("approximateLocation", !state.preferences.approximateLocation)}
          />
          <p className="privacy-location-note">
            <Icon name="pin" size={15} />
            Location permission is only requested if you choose “Use my location”.
          </p>
        </section>
        <section className="settings-group account-settings">
          <h2>Account</h2>
          <button type="button" className="settings-row-link" onClick={() => setShowBlocked(true)}>
            <span>
              <strong>Blocked accounts</strong>
              <small>
                {state.blockedUsers.length
                  ? `${state.blockedUsers.length} account${state.blockedUsers.length === 1 ? "" : "s"}`
                  : "Manage players you’ve blocked"}
              </small>
            </span>
            <Icon name="chevronRight" size={17} />
          </button>
          <button type="button" className="delete-account" onClick={confirmDelete}>
            Reset demo data
          </button>
        </section>
        <section className="settings-group help-settings">
          <h2>Need help?</h2>
          <button
            type="button"
            className="settings-row-link"
            onClick={() => dispatch({ type: "NAVIGATE", screen: "faq" })}
          >
            <span>
              <strong>FAQ & support</strong>
              <small>Find answers about matches and your account</small>
            </span>
            <Icon name="chevronRight" size={17} />
          </button>
        </section>
      </div>
      <footer className="settings-footer">
        <Button
          type="button"
          className="button-large"
          onClick={() => {
            setSaved(true);
            onToast("Your preferences are saved on this device.");
          }}
        >
          {saved ? "Saved" : "Confirm"}
          <Icon name="check" size={17} />
        </Button>
      </footer>
      {showBlocked && (
        <div
          className="sheet-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowBlocked(false);
          }}
        >
          <section
            className="blocked-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="blocked-title"
          >
            <div className="sheet-grabber" />
            <header className="sheet-header">
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowBlocked(false)}
                aria-label="Close blocked accounts"
              >
                <Icon name="close" />
              </button>
              <h2 id="blocked-title">Blocked accounts</h2>
              <span />
            </header>
            {state.blockedUsers.length ? (
              state.blockedUsers.map((username) => (
                <div className="blocked-row" key={username}>
                  <span>
                    <Icon name="user" size={18} />
                    {username}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: "UNBLOCK_USER", username });
                      onToast("Account unblocked.");
                    }}
                  >
                    Unblock
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state blocked-empty">
                <div className="empty-emoji">🛡️</div>
                <h3>No blocked accounts</h3>
                <p>Players you block will be listed here.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function PreferenceRow({
  item,
  value,
  onToggle,
}: {
  item: { key: keyof Preferences; title: string; description: string };
  value: boolean;
  onToggle: () => void;
}) {
  const locked = item.key === "essential";
  return (
    <div className="preference-row">
      <div>
        <strong>{item.title}</strong>
        <p>{item.description}</p>
      </div>
      <button
        type="button"
        className={`toggle-switch ${value ? "on" : ""}`}
        role="switch"
        aria-checked={value}
        aria-label={`${item.title} preference`}
        disabled={locked}
        onClick={onToggle}
      >
        <span />
      </button>
    </div>
  );
}
