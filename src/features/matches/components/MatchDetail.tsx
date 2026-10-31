"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { AppState, Match } from "@/lib/domain";
import { SPORTS } from "@/lib/domain";
import { useAppStore } from "@/lib/app-store";
import { formatMatchDate } from "@/features/matches/components/MatchCard";
import { getCityMapEmbedUrl, getOpenMapSearchUrl } from "@/lib/maps";

const demoPlayers = [
  "Maya Khan",
  "Leo Parker",
  "Sam Rivers",
  "Amira Saleh",
  "Nico Green",
  "Alex Morgan",
  "Charlie James",
];

export function MatchDetail({
  match,
  state,
  onBack,
  onToast,
}: {
  match: Match;
  state: AppState;
  onBack: () => void;
  onToast: (message: string) => void;
}) {
  const { dispatch } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const outgoing = state.requests.find(
    (request) => request.matchId === match.id && request.direction === "outgoing",
  );
  const saved = state.savedMatchIds.includes(match.id);
  const full = match.players >= match.capacity;
  const isHost = match.hostHandle === state.profile.username;

  async function shareMatch() {
    const shareUrl = `${window.location.origin}${window.location.pathname}#match=${encodeURIComponent(match.id)}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: match.title,
          text: `Join me for ${match.sport} at ${match.venue}`,
          url: shareUrl,
        });
      else {
        await navigator.clipboard.writeText(shareUrl);
        onToast("Match link copied.");
      }
    } catch {
      onToast("Sharing was cancelled.");
    }
  }
  async function copyMatch() {
    const url = `${window.location.origin}${window.location.pathname}#match=${encodeURIComponent(match.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      onToast("Match link copied.");
    } catch {
      onToast("Copying isn’t available in this browser.");
    }
    setMoreOpen(false);
  }

  const players = [match.host, ...demoPlayers].slice(0, Math.max(1, match.players));
  const visiblePlayers = showAll ? players : players.slice(0, 4);
  const emoji = SPORTS.find((sport) => sport.name === match.sport)?.emoji;

  return (
    <div className="match-detail-page">
      <header className="flow-header">
        <button type="button" className="icon-button" aria-label="Back to matches" onClick={onBack}>
          <Icon name="arrowLeft" />
        </button>
        <span className="flow-header-title">Match details</span>
        <div className="flow-header-actions">
          <button
            type="button"
            className={`icon-button ${saved ? "saved" : ""}`}
            aria-label={saved ? "Unsave match" : "Save match"}
            aria-pressed={saved}
            onClick={() => {
              dispatch({ type: "TOGGLE_SAVED", id: match.id });
              onToast(saved ? "Removed from saved matches." : "Saved for later.");
            }}
          >
            <Icon name="bookmark" fill={saved ? "currentColor" : "none"} />
          </button>
          <div className="more-wrap">
            <button
              type="button"
              className="icon-button"
              aria-label="More match options"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(!moreOpen)}
            >
              <Icon name="more" />
            </button>
            {moreOpen && (
              <div className="more-menu">
                <button
                  type="button"
                  onClick={() => {
                    void shareMatch();
                    setMoreOpen(false);
                  }}
                >
                  <Icon name="share" size={16} />
                  Share
                </button>
                <button type="button" onClick={() => void copyMatch()}>
                  <Icon name="copy" size={16} />
                  Copy match link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReportOpen(true);
                    setMoreOpen(false);
                  }}
                >
                  <Icon name="help" size={16} />
                  Report match
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <section className="detail-hero">
        <span className="detail-sport-icon">{emoji}</span>
        <div>
          <p className="eyebrow">
            {match.sport} · {match.format === "Team" ? "Teams welcome" : "Players welcome"}
          </p>
          <h1>{match.title}</h1>
        </div>
      </section>
      <div className="detail-date-line">
        <strong>{formatMatchDate(match.date)}</strong>
        <span>{match.time}</span>
        <span className="detail-separator" /> <span>{match.duration} min</span>
      </div>
      <button
        type="button"
        className="detail-host"
        onClick={() => {
          dispatch({
            type: "OPEN_PROFILE",
            target: match.hostHandle === state.profile.username ? "mine" : "other",
            matchId: match.id,
          });
        }}
      >
        <Avatar name={match.host} src={match.hostAvatar} />
        <span>
          <small>Hosted by</small>
          <strong>{match.host}</strong>
        </span>
        <Icon name="chevronRight" size={17} />
      </button>
      <div className="detail-tabs" role="tablist" aria-label="Match information">
        {(["Venue", "Details", "Players"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            role="tab"
            aria-selected={state.detailTab === tab}
            className={state.detailTab === tab ? "active" : ""}
            onClick={() => dispatch({ type: "SET_DETAIL_TAB", tab })}
          >
            {tab === "Players" ? `Players (${match.players}/${match.capacity})` : tab}
          </button>
        ))}
      </div>
      {state.detailTab === "Venue" && (
        <section className="detail-panel">
          <h2>Venue</h2>
          <div className="venue-detail-row">
            <Icon name="pin" size={19} />
            <span>{match.address}</span>
          </div>
          <div className="venue-detail-row">
            <Icon name="trophy" size={19} />
            <span>{match.venue}</span>
          </div>
          <div className="map-preview">
            <iframe
              title={`Approximate city map for ${match.city}`}
              loading="lazy"
              src={getCityMapEmbedUrl(match.city)}
            />
            <a
              href={getOpenMapSearchUrl(match.venue, match.address)}
              target="_blank"
              rel="noreferrer"
            >
              Open map <Icon name="arrowRight" size={14} />
            </a>
          </div>
        </section>
      )}
      {state.detailTab === "Details" && (
        <section className="detail-panel">
          <h2>Details</h2>
          <dl className="detail-list">
            <div>
              <dt>
                <Icon name="calendar" size={17} />
                Date
              </dt>
              <dd>{formatMatchDate(match.date)}</dd>
            </div>
            <div>
              <dt>
                <Icon name="clock" size={17} />
                Time
              </dt>
              <dd>{match.time}</dd>
            </div>
            <div>
              <dt>
                <Icon name="clock" size={17} />
                Duration
              </dt>
              <dd>{match.duration} min</dd>
            </div>
            <div>
              <dt>
                <Icon name="star" size={17} />
                Skill level
              </dt>
              <dd>{match.skillLevels.join(", ")}</dd>
            </div>
            <div>
              <dt>
                <Icon name="users" size={17} />
                Age group
              </dt>
              <dd>{match.ageGroups.join(", ")}</dd>
            </div>
            <div>
              <dt>
                <Icon name="user" size={17} />
                Entry fee
              </dt>
              <dd>{match.fee ? `£${match.fee} / player` : "Free"}</dd>
            </div>
            <div>
              <dt>
                <Icon name="users" size={17} />
                Access
              </dt>
              <dd>{match.access}</dd>
            </div>
          </dl>
          <div className="description-block">
            <h3>Description</h3>
            <p>{match.description || "The host hasn’t added extra notes yet."}</p>
          </div>
        </section>
      )}
      {state.detailTab === "Players" && (
        <section className="detail-panel players-panel">
          <div className="detail-section-heading">
            <h2>Host</h2>
            <span className="host-rating">
              <Icon name="star" size={15} fill="currentColor" />
              4.7
            </span>
          </div>
          <button
            type="button"
            className="player-row"
            onClick={() =>
              dispatch({
                type: "OPEN_PROFILE",
                target: match.hostHandle === state.profile.username ? "mine" : "other",
                matchId: match.id,
              })
            }
          >
            <Avatar name={match.host} src={match.hostAvatar} />
            <span>
              <strong>{match.host}</strong>
              <small>
                {state.profile.ageGroup} ·{" "}
                {state.profile.skillBySport[match.sport] ?? "Intermediate"}
              </small>
            </span>
            <Icon name="chevronRight" size={16} />
          </button>
          <div className="host-stats">
            <span>
              <Icon name="trophy" size={16} />
              13 hosted
            </span>
            <span>
              <Icon name="star" size={16} />
              17 played
            </span>
            <span>Advanced</span>
          </div>
          <div className="detail-section-heading players-title">
            <h2>Players</h2>
            <span>
              {match.players}/{match.capacity}
            </span>
          </div>
          {visiblePlayers.slice(1).map((name, index) => (
            <div className="player-row" key={`${name}-${index}`}>
              <Avatar name={name} />
              <span>
                <strong>{name}</strong>
                <small>
                  <Icon name="users" size={14} /> {index % 2 ? "30–45" : "18–30"}
                </small>
              </span>
            </div>
          ))}
          {players.length > 4 && (
            <button type="button" className="show-all-button" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show fewer players" : "Show all players"}
              <Icon name="chevronDown" size={16} />
            </button>
          )}
        </section>
      )}
      <footer className="detail-action-bar">
        <Button
          type="button"
          variant="outline"
          className="share-icon-button"
          aria-label="Share match"
          onClick={() => void shareMatch()}
        >
          <Icon name="share" size={19} />
        </Button>
        {state.acceptedMatchIds.includes(match.id) ? (
          <Button
            type="button"
            variant="danger"
            className="detail-join-button"
            onClick={() => {
              dispatch({ type: "LEAVE_MATCH", id: match.id });
              onToast("You left this match.");
            }}
          >
            Leave match
          </Button>
        ) : outgoing?.status === "pending" ? (
          <Button
            type="button"
            variant="danger"
            className="detail-join-button"
            onClick={() => {
              dispatch({ type: "CANCEL_REQUEST", id: outgoing.id });
              onToast("Your request was cancelled.");
            }}
          >
            Cancel request
          </Button>
        ) : isHost ? (
          <div className="host-detail-actions">
            <Button
              type="button"
              variant="outline"
              className="detail-join-button"
              onClick={() => dispatch({ type: "EDIT_MATCH", id: match.id })}
            >
              Edit match
            </Button>
            <Button
              type="button"
              variant="danger"
              className="detail-join-button"
              onClick={() => {
                if (!window.confirm(`Cancel “${match.title}” and remove it from Hambazi?`)) return;
                dispatch({ type: "CANCEL_MATCH", id: match.id });
                onToast("Match cancelled.");
              }}
            >
              Cancel match
            </Button>
          </div>
        ) : match.access === "Private" ? (
          <Button type="button" variant="outline" className="detail-join-button" disabled>
            Invite-only match
          </Button>
        ) : (
          <Button
            type="button"
            className="detail-join-button"
            disabled={full || outgoing?.status === "accepted"}
            onClick={() => {
              if (!navigator.onLine) {
                onToast("Reconnect to send a join request.");
                return;
              }
              dispatch({
                type: "REQUEST_TO_JOIN",
                id: match.id,
                requestId: `request-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              });
              onToast("Your request was sent to the host.");
            }}
          >
            {full ? "Match full" : outgoing?.status === "accepted" ? "You’re in" : "Send request"}
          </Button>
        )}
      </footer>
      {reportOpen && (
        <div
          className="sheet-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setReportOpen(false);
          }}
        >
          <section
            className="report-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
          >
            <div className="sheet-grabber" />
            <h2 id="report-title">Report this match</h2>
            <p>Tell us what’s wrong so we can review it.</p>
            {["Inaccurate details", "Inappropriate content", "Safety concern"].map((reason) => (
              <button
                type="button"
                key={reason}
                onClick={() => {
                  setReportOpen(false);
                  onToast("Reporting is unavailable in this local demo.");
                }}
              >
                {reason}
                <Icon name="chevronRight" size={16} />
              </button>
            ))}
            <Button type="button" variant="quiet" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
          </section>
        </div>
      )}
    </div>
  );
}
