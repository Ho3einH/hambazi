"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import "@/features/discovery/discovery.css";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  FilterSheet,
  filterMatches,
  EMPTY_FILTERS,
  type MatchFilters,
} from "@/features/discovery/components/FilterSheet";
import { MatchCard } from "@/features/matches/components/MatchCard";
import { SPORTS, type AppState } from "@/lib/domain";
import { useAppStore } from "@/lib/app-store";
import { isBlocked } from "@/lib/users";

export function HomePage({
  state,
  onToast,
  onCreate,
}: {
  state: AppState;
  onToast: (message: string) => void;
  onCreate: () => void;
}) {
  const { dispatch } = useAppStore();
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const discoverable = useMemo(
    () =>
      state.matches.filter(
        (match) =>
          match.city.toLowerCase() === state.location.toLowerCase() &&
          !isBlocked(state.blockedUsers, match.hostHandle) &&
          (match.access === "Public" || match.hostHandle === state.profile.username),
      ),
    [state.matches, state.location, state.profile.username, state.blockedUsers],
  );
  const matches = useMemo(
    () => filterMatches(discoverable, filters, query),
    [discoverable, filters, query],
  );
  const filteredCount = matches.length;
  const requestFor = (id: string) =>
    state.requests.find((request) => request.matchId === id && request.direction === "outgoing");

  return (
    <div className="discovery-page">
      <section className="home-welcome">
        <div className="home-welcome-copy">
          <div className="home-welcome-greeting">
            <Avatar name={state.profile.name} src={state.profile.avatar} size="sm" />
            <span>
              Good to see you, {state.profile.name.split(" ")[0]} <span aria-hidden="true">👋</span>
            </span>
          </div>
          <p className="eyebrow">MAKE TIME TO PLAY</p>
          <h1>
            Find a game
            <br />
            <span>near you.</span>
          </h1>
          <p className="welcome-subtitle">Your next good game is closer than you think.</p>
          <Button type="button" className="host-cta" onClick={onCreate}>
            Host a match <Icon name="arrowRight" size={17} />
          </Button>
        </div>
        <div className="home-welcome-art" aria-hidden="true">
          <Image src="/art/player-location.webp" alt="" width={400} height={464} priority />
        </div>
        <div className="welcome-stat">
          <span>✦</span>
          <strong>{matches.length}</strong>
          <small>games to explore</small>
        </div>
      </section>

      <section className="discover-toolbar" aria-label="Find matches">
        <label className="search-input">
          <Icon name="search" size={19} />
          <input
            type="search"
            placeholder="Search sport, venue or area"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="sr-only">Search matches</span>
        </label>
        <Button
          type="button"
          variant="outline"
          className="filter-button"
          onClick={() => setFilterOpen(true)}
        >
          <Icon name="sliders" size={18} />
          <span>Filters</span>
          <span className="filter-count">
            {[
              filters.sport !== "All sports",
              Boolean(filters.dateFrom || filters.dateTo),
              filters.time.length > 0,
              filters.skills.length > 0,
              filters.ages.length > 0,
            ].filter(Boolean).length || ""}
          </span>
        </Button>
      </section>

      <section className="sports-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">PICK YOUR SPORT</p>
            <h2>What do you feel like?</h2>
          </div>
          <button type="button" className="text-link" onClick={() => setFilters(EMPTY_FILTERS)}>
            All games
          </button>
        </div>
        <div className="sport-scroller" role="group" aria-label="Filter by sport">
          {[{ name: "All sports" as const, emoji: "✦" }, ...SPORTS].map(({ name, emoji }) => (
            <button
              type="button"
              key={name}
              className={`sport-chip ${filters.sport === name ? "selected" : ""}`}
              aria-pressed={filters.sport === name}
              onClick={() => setFilters({ ...filters, sport: name })}
            >
              <span>{emoji}</span>
              {name}
            </button>
          ))}
        </div>
      </section>

      <section className="games-section">
        <div className="games-heading">
          <div>
            <p className="eyebrow">OUT THERE, PLAYING</p>
            <h2>Matches near {state.location}</h2>
          </div>
          <span className="result-count">
            {matches.length} {matches.length === 1 ? "game" : "games"}
          </span>
        </div>
        {matches.length > 0 ? (
          <div className="match-grid">
            {matches.map((match) => {
              const request = requestFor(match.id);
              const isHost = match.hostHandle === state.profile.username;
              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  saved={state.savedMatchIds.includes(match.id)}
                  requestStatus={
                    request?.status === "pending" || request?.status === "accepted"
                      ? request.status
                      : undefined
                  }
                  onOpen={() => dispatch({ type: "OPEN_MATCH", id: match.id })}
                  onSave={() => {
                    dispatch({ type: "TOGGLE_SAVED", id: match.id });
                    onToast(
                      state.savedMatchIds.includes(match.id)
                        ? "Removed from saved matches."
                        : "Saved for later.",
                    );
                  }}
                  onJoin={
                    !isHost && match.access === "Public"
                      ? () => {
                          if (!navigator.onLine) {
                            onToast("You’re offline. Reconnect to send a request.");
                            return;
                          }
                          dispatch({
                            type: "REQUEST_TO_JOIN",
                            id: match.id,
                            requestId: `request-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                          });
                          onToast("Your request was sent to the host.");
                        }
                      : undefined
                  }
                  onCancelRequest={
                    request?.status === "pending"
                      ? () => {
                          dispatch({ type: "CANCEL_REQUEST", id: request.id });
                          onToast("Your request was cancelled.");
                        }
                      : undefined
                  }
                  actionLabel={isHost ? "Your match" : undefined}
                />
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-emoji">🏃</div>
            <h3>No games found</h3>
            <p>Try another sport, city or filter. New games are added all the time.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery("");
                setFilters(EMPTY_FILTERS);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
        <p className="local-data-note">
          <Icon name="check" size={15} /> Match listings are demo content saved on this device. Join
          requests are local only.
        </p>
      </section>
      <FilterSheet
        key={filterOpen ? "open" : "closed"}
        open={filterOpen}
        value={filters}
        count={filteredCount}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />
    </div>
  );
}
