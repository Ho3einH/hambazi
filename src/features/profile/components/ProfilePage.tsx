"use client";

import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  SPORTS,
  type AgeGroup,
  type AppState,
  type Conversation,
  type Match,
  type Profile,
  type Sport,
} from "@/lib/domain";
import { useAppStore } from "@/lib/app-store";
import { isBlocked } from "@/lib/users";
import { getApproximateDemoCity } from "@/lib/geolocation";

const otherPlayer: Profile = {
  name: "Maya Khan",
  username: "@mayak",
  city: "London",
  gender: "Woman",
  ageGroup: "30–45",
  bio: "Always happy to meet new people for a friendly rally. Mostly on court at the weekends.",
  sports: ["Badminton", "Tennis"],
  skillBySport: { Badminton: "Advanced", Tennis: "Intermediate" },
};

export function ProfilePage({
  state,
  isOther = false,
  otherMatch,
  otherConversation,
  onToast,
}: {
  state: AppState;
  isOther?: boolean;
  otherMatch?: Match;
  otherConversation?: Conversation;
  onToast: (message: string) => void;
}) {
  const { dispatch } = useAppStore();
  const relatedMatch =
    otherMatch ?? state.matches.find((item) => item.title === otherConversation?.matchTitle);
  const profile = isOther
    ? otherConversation?.username === otherPlayer.username
      ? otherPlayer
      : otherConversation
        ? {
            name: otherConversation.name,
            username: otherConversation.username,
            city: relatedMatch?.city ?? state.location,
            gender: "Not specified",
            ageGroup: relatedMatch?.ageGroups[0] ?? "All ages",
            bio: "Player on Hambazi. Start a conversation to get to know them.",
            sports: relatedMatch ? [relatedMatch.sport] : [],
            skillBySport: relatedMatch ? { [relatedMatch.sport]: relatedMatch.skillLevels[0] } : {},
            avatar: otherConversation.avatar,
          }
        : otherMatch?.hostHandle === otherPlayer.username
          ? otherPlayer
          : otherMatch
            ? {
                name: otherMatch.host,
                username: otherMatch.hostHandle,
                city: otherMatch.city,
                gender: "Not specified",
                ageGroup: otherMatch.ageGroups[0] ?? "All ages",
                bio: "Hambazi match host. Open a match to see their game details.",
                sports: [otherMatch.sport],
                skillBySport: { [otherMatch.sport]: otherMatch.skillLevels[0] },
                avatar: otherMatch.hostAvatar,
              }
            : otherPlayer
    : state.profile;
  const blocked = isOther && isBlocked(state.blockedUsers, profile.username);
  const [editOpen, setEditOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [answersOpen, setAnswersOpen] = useState(true);

  async function shareProfile() {
    const url = `${window.location.origin}${window.location.pathname}#profile=${encodeURIComponent(profile.username)}`;
    try {
      if (navigator.share) await navigator.share({ title: `${profile.name} on Hambazi`, url });
      else {
        await navigator.clipboard.writeText(url);
        onToast("Profile link copied.");
      }
    } catch {
      onToast("Sharing was cancelled.");
    }
  }

  return (
    <section className={`profile-page ${isOther ? "other-profile-page" : ""}`}>
      <header className="profile-page-header">
        <button
          type="button"
          className="icon-button"
          aria-label="Back"
          onClick={() => {
            if (!isOther) {
              dispatch({ type: "SET_MAIN_TAB", tab: "More" });
            } else if (state.profileConversationId) {
              dispatch({ type: "OPEN_CHAT", id: state.profileConversationId });
            } else if (state.profileMatchId) {
              dispatch({ type: "NAVIGATE", screen: "match-detail" });
            } else {
              dispatch({ type: "SET_MAIN_TAB", tab: "Messages" });
            }
          }}
        >
          <Icon name="arrowLeft" />
        </button>
        <span>{isOther ? "Player profile" : "Your profile"}</span>
        <div className="more-wrap">
          <button
            type="button"
            className="icon-button"
            aria-label="Share profile"
            onClick={() => void shareProfile()}
          >
            <Icon name="share" />
          </button>
          {isOther && (
            <>
              <button
                type="button"
                className="icon-button profile-more"
                aria-label="More profile options"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen(!moreOpen)}
              >
                <Icon name="more" />
              </button>
              {moreOpen && (
                <div className="more-menu profile-more-menu">
                  <button
                    type="button"
                    onClick={() => {
                      void shareProfile();
                      setMoreOpen(false);
                    }}
                  >
                    <Icon name="share" size={16} />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `${window.location.origin}/#profile=${profile.username}`,
                        );
                        onToast("Profile link copied.");
                      } catch {
                        onToast("Copying isn’t available.");
                      }
                      setMoreOpen(false);
                    }}
                  >
                    <Icon name="copy" size={16} />
                    Copy profile link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (blocked) {
                        dispatch({ type: "UNBLOCK_USER", username: profile.username });
                        onToast("Account unblocked.");
                      } else {
                        dispatch({ type: "BLOCK_USER", username: profile.username });
                        onToast("Account blocked. Manage blocked accounts in Settings.");
                      }
                      setMoreOpen(false);
                    }}
                  >
                    <Icon name={blocked ? "check" : "close"} size={16} />
                    {blocked ? "Unblock account" : "Block account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onToast("Reporting is unavailable in this local demo.");
                      setMoreOpen(false);
                    }}
                  >
                    <Icon name="help" size={16} />
                    Report
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </header>
      <div className="profile-summary">
        <Avatar name={profile.name} src={profile.avatar} size="xl" />
        {isOther ? (
          <div className="profile-actions">
            <Button
              type="button"
              disabled={blocked}
              onClick={() => {
                dispatch({
                  type: "START_CONVERSATION",
                  id: `conversation-${profile.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
                  name: profile.name,
                  username: profile.username,
                  matchTitle: otherMatch?.title ?? "Let's play",
                  avatar: profile.avatar,
                });
              }}
            >
              {blocked ? "Blocked" : "Message"} <Icon name="message" size={17} />
            </Button>
            <button
              type="button"
              className="profile-more-small"
              aria-label="More options"
              onClick={() => setMoreOpen(!moreOpen)}
            >
              <Icon name="more" />
            </button>
          </div>
        ) : (
          <div className="profile-actions">
            <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
              Edit profile
            </Button>
            <Button type="button" variant="outline" onClick={() => void shareProfile()}>
              Share profile
            </Button>
          </div>
        )}
      </div>
      <div className="profile-name-block">
        <h1>{profile.name}</h1>
        <span>{profile.username}</span>
        {!isOther && (
          <p>
            <Icon name="pin" size={15} />
            {profile.city}
          </p>
        )}
      </div>
      <section className="profile-section">
        <div className="profile-section-heading">
          <h2>About me</h2>
          {isOther && (
            <span className="profile-verified">
              <Icon name="check" size={13} />
              Player
            </span>
          )}
        </div>
        <p className="profile-bio">{profile.bio || "Add a little about what you enjoy playing."}</p>
      </section>
      <section className="profile-section">
        <h2>Player info</h2>
        <div className="profile-info-grid">
          <span>
            <Icon name="pin" size={17} />
            {profile.city}
          </span>
          <span>
            <Icon name="user" size={17} />
            {profile.gender}
          </span>
          <span>
            <Icon name="users" size={17} />
            {profile.ageGroup}
          </span>
        </div>
      </section>
      <section className="profile-section">
        <h2>Sports</h2>
        <div className="profile-sports">
          {profile.sports.map((sport: Sport) => (
            <span
              key={sport}
              className={`profile-sport-pill ${sport === "Football" ? "green" : ""}`}
            >
              <span>{SPORTS.find((item) => item.name === sport)?.emoji}</span>
              {sport}
            </span>
          ))}
        </div>
        <div className="profile-stats">
          <span>
            <Icon name="trophy" size={17} />
            <span>
              <strong>{isOther ? 13 : state.hostedMatchIds.length}</strong> Hosted
            </span>
          </span>
          <span>
            <Icon name="star" size={17} />
            <span>
              <strong>{isOther ? 17 : state.playedMatchIds.length}</strong> Played
            </span>
          </span>
          <span>
            <Icon name="check" size={17} />
            <span>{profile.skillBySport[profile.sports[0]] ?? "Intermediate"}</span>
          </span>
          <span className="rating-stat">
            <Icon name="star" size={17} fill="currentColor" />
            <span>{isOther ? "4.7" : "4.5"}</span>
          </span>
        </div>
      </section>
      <section className="profile-section reviews-section">
        <div className="profile-section-heading">
          <h2>Reviews</h2>
          <span className="review-average">
            <Icon name="star" size={17} fill="currentColor" />
            {isOther ? "4.7" : "4.5"}
          </span>
        </div>
        <article className="review-card">
          <div className="review-header">
            <Avatar name="Jason Milner" />
            <div>
              <strong>Jason Milner</strong>
              <span>★★★★★</span>
            </div>
            <time>1 week ago</time>
          </div>
          <p>They play very well and make every game feel welcoming.</p>
          <button
            type="button"
            className="review-replies-toggle"
            aria-expanded={answersOpen}
            onClick={() => setAnswersOpen(!answersOpen)}
          >
            <Icon name="chevronDown" size={15} />
            {answersOpen ? "Hide" : "View"} 1 reply
          </button>
          {answersOpen && (
            <div className="review-reply">
              <Avatar name={profile.name} src={profile.avatar} size="sm" />
              <div>
                <strong>{profile.name}</strong>
                <p>Thanks for the kind words!</p>
              </div>
              <time>5 days ago</time>
            </div>
          )}
        </article>
      </section>
      {!isOther && (
        <div className="profile-footer-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch({ type: "NAVIGATE", screen: "settings" })}
          >
            <Icon name="settings" size={17} />
            Settings & privacy
          </Button>
          <Button
            type="button"
            variant="quiet"
            onClick={() => {
              window.sessionStorage.removeItem("hambazi-demo-token");
              dispatch({ type: "SIGN_OUT" });
              onToast("You’ve signed out of this demo.");
            }}
          >
            <Icon name="logout" size={17} />
            Sign out
          </Button>
        </div>
      )}
      {editOpen && (
        <EditProfileDialog
          profile={state.profile}
          allowLocation={state.preferences.approximateLocation}
          onClose={() => setEditOpen(false)}
          onSave={(updated) => {
            dispatch({ type: "UPDATE_PROFILE", profile: updated });
            setEditOpen(false);
            onToast("Your profile has been updated.");
          }}
        />
      )}
    </section>
  );
}

function EditProfileDialog({
  profile,
  allowLocation,
  onClose,
  onSave,
}: {
  profile: Profile;
  allowLocation: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    onSave(draft);
  }
  return (
    <div
      className="sheet-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="edit-profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        <div className="sheet-grabber" />
        <header className="sheet-header">
          <button
            type="button"
            className="icon-button"
            aria-label="Close edit profile"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
          <h2 id="edit-profile-title">Edit profile</h2>
          <span />
        </header>
        <form className="edit-profile-form" onSubmit={submit}>
          <div className="edit-avatar">
            <Avatar name={draft.name} src={draft.avatar} size="xl" />
            <label className="avatar-upload-button" aria-label="Change profile photo">
              <Icon name="user" size={15} />
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1_000_000) {
                    setError("Choose an image smaller than 1 MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string")
                      setDraft({ ...draft, avatar: reader.result });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          <label className="field">
            <span>Full name</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Username</span>
            <input
              value={draft.username}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  username: event.target.value.startsWith("@")
                    ? event.target.value
                    : `@${event.target.value}`,
                })
              }
              required
            />
          </label>
          <label className="field">
            <span>About me</span>
            <textarea
              value={draft.bio}
              onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
              maxLength={240}
              rows={3}
            />
          </label>
          <div className="field-grid">
            <div className="city-setting-field">
              <label className="field">
                <span>City</span>
                <input
                  value={draft.city}
                  onChange={(event) => setDraft({ ...draft, city: event.target.value })}
                  required
                />
              </label>
              <button
                type="button"
                className="location-detect"
                disabled={!allowLocation || locationLoading}
                onClick={() => {
                  setLocationLoading(true);
                  setError("");
                  void getApproximateDemoCity()
                    .then((city) => setDraft((current) => ({ ...current, city })))
                    .catch((cause: unknown) =>
                      setError(cause instanceof Error ? cause.message : "Choose a city manually."),
                    )
                    .finally(() => setLocationLoading(false));
                }}
              >
                <Icon name="pin" size={15} />
                {locationLoading ? "Finding city…" : "Use my location"}
              </button>
            </div>
            <label className="field">
              <span>Age group</span>
              <select
                value={draft.ageGroup}
                onChange={(event) =>
                  setDraft({ ...draft, ageGroup: event.target.value as AgeGroup })
                }
              >
                {["Under 18", "18–30", "30–45", "+45", "All ages"].map((age) => (
                  <option key={age}>{age}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Gender</span>
            <select
              value={draft.gender}
              onChange={(event) => setDraft({ ...draft, gender: event.target.value })}
            >
              {["Man", "Woman", "Non-binary", "Prefer not to say"].map((gender) => (
                <option key={gender}>{gender}</option>
              ))}
            </select>
          </label>
          <div className="edit-sports">
            <h3>Sports</h3>
            <div className="choice-row">
              {SPORTS.map(({ name, emoji }) => (
                <button
                  type="button"
                  className={`choice-pill ${draft.sports.includes(name) ? "selected" : ""}`}
                  key={name}
                  aria-pressed={draft.sports.includes(name)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      sports: draft.sports.includes(name)
                        ? draft.sports.filter((sport) => sport !== name)
                        : [...draft.sports, name],
                    })
                  }
                >
                  {emoji} {name}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <footer className="sheet-footer">
            <Button type="submit" className="button-large">
              Confirm changes
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
