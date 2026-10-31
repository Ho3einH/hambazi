"use client";

import "@/features/matches/matches.css";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Match, Sport } from "@/lib/domain";
import { SPORTS } from "@/lib/domain";

export function formatMatchDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(parsed);
}

export function MatchCard({
  match,
  saved,
  requestStatus,
  onOpen,
  onSave,
  onJoin,
  onCancelRequest,
  actionLabel,
}: {
  match: Match;
  saved: boolean;
  requestStatus?: "pending" | "accepted" | "declined";
  onOpen: () => void;
  onSave?: () => void;
  onJoin?: () => void;
  onCancelRequest?: () => void;
  actionLabel?: string;
}) {
  const emoji = SPORTS.find((sport) => sport.name === match.sport)?.emoji;
  const full = match.players >= match.capacity;
  const percent = Math.min(100, Math.round((match.players / match.capacity) * 100));
  return (
    <article className="match-card">
      <div className="match-card-heading">
        <span className="sport-avatar" aria-hidden="true">
          {emoji}
        </span>
        <button type="button" className="match-title-button" onClick={onOpen}>
          <span className="sport-caption">{match.sport} match</span>
          <strong>{match.title}</strong>
        </button>
        <span className={`match-format-chip ${match.format === "Team" ? "team" : "players"}`}>
          <Icon name="users" size={13} />
          {match.format}
        </span>
        {onSave && (
          <button
            type="button"
            className={`save-button ${saved ? "saved" : ""}`}
            aria-label={saved ? "Remove from saved matches" : "Save match"}
            aria-pressed={saved}
            onClick={onSave}
          >
            <Icon name="bookmark" size={19} fill={saved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <div className="match-card-body">
        <div className="match-facts-row">
          <span className="match-fact">
            <span className="fact-icon">
              <Icon name="calendar" size={17} />
            </span>
            {formatMatchDate(match.date)}
          </span>
          <span className="match-fact">
            <span className="fact-icon">
              <Icon name="clock" size={17} />
            </span>
            {match.time}
          </span>
          <span className="match-fact duration-fact">
            <span className="fact-icon">
              <Icon name="clock" size={17} />
            </span>
            {match.duration} min
          </span>
        </div>
        <div className="match-venue">
          <Icon name="pin" size={18} />
          <span>
            <strong>{match.venue}</strong>
            <small>{match.address}</small>
          </span>
        </div>
        <div className="match-meta-row">
          <span className="meta-icon">
            <Icon name="star" size={18} />
          </span>
          <span>{match.skillLevels.join(", ")}</span>
        </div>
        <div className="tag-row">
          {match.skillLevels.slice(0, 2).map((level) => (
            <span key={level} className="skill-pill">
              {level}
            </span>
          ))}
          <span className="skill-pill muted-pill">{match.ageGroups.join(", ")}</span>
        </div>
        <div className="match-player-count">
          <span>
            <Icon name="users" size={18} />{" "}
            <strong>
              {match.players}/{match.capacity}
            </strong>{" "}
            Players
          </span>
          <small>{full ? "Full" : `${match.capacity - match.players} spots left`}</small>
        </div>
        <div
          className="capacity-track"
          role="progressbar"
          aria-label={`${match.players} of ${match.capacity} players joined`}
          aria-valuenow={match.players}
          aria-valuemin={0}
          aria-valuemax={match.capacity}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        <div className="match-card-foot">
          <span className="match-host">
            <Avatar name={match.host} src={match.hostAvatar} size="sm" />
            <span>
              Hosted by <strong>{match.host}</strong>
            </span>
          </span>
          <strong className="match-price">
            {match.fee === 0 ? "Free" : `£${match.fee}`}
            <small>{match.fee ? " / player" : ""}</small>
          </strong>
        </div>
        <div className="match-card-actions">
          <Button type="button" variant="outline" onClick={onOpen}>
            Details
          </Button>
          {requestStatus === "pending" && onCancelRequest ? (
            <Button type="button" variant="quiet" onClick={onCancelRequest}>
              Cancel request
            </Button>
          ) : (
            onJoin && (
              <Button
                type="button"
                variant={requestStatus === "accepted" ? "success" : "primary"}
                disabled={full || requestStatus === "accepted"}
                onClick={onJoin}
              >
                {full
                  ? "Match full"
                  : (actionLabel ?? (requestStatus === "accepted" ? "Joined" : "Send request"))}
              </Button>
            )
          )}
        </div>
        {requestStatus === "pending" && (
          <p className="inline-status">
            <Icon name="clock" size={14} /> Request sent · waiting for host
          </p>
        )}
      </div>
    </article>
  );
}

export type SportFilter = Sport | "All sports";
