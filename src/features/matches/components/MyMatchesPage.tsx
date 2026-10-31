"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MatchCard } from "@/features/matches/components/MatchCard";
import type { AppState, Match } from "@/lib/domain";
import { useAppStore } from "@/lib/app-store";
import { selectVisiblePendingRequests } from "@/lib/selectors";

const tabs = ["Upcoming", "Requests", "Hosted", "Played", "Saved matches"] as const;
type MatchTab = (typeof tabs)[number];

export function MyMatchesPage({
  state,
  onToast,
}: {
  state: AppState;
  onToast: (message: string) => void;
}) {
  const { dispatch } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const tab: MatchTab = state.matchesTab;
  const items = useMemo(() => {
    const ids =
      tab === "Upcoming"
        ? state.acceptedMatchIds
        : tab === "Hosted"
          ? state.hostedMatchIds
          : tab === "Played"
            ? state.playedMatchIds
            : tab === "Saved matches"
              ? state.savedMatchIds
              : [];
    return ids
      .map((id) => state.matches.find((match) => match.id === id))
      .filter((match): match is Match => Boolean(match));
  }, [state, tab]);
  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return items;
    return items.filter((match) =>
      [match.title, match.sport, match.venue, match.city, match.host].some((value) =>
        value.toLocaleLowerCase().includes(normalized),
      ),
    );
  }, [items, query]);
  const requests = selectVisiblePendingRequests(state);
  const emptyCopy: Record<Exclude<MatchTab, "Requests">, [string, string]> = {
    Upcoming: [
      "Your next game is waiting",
      "When a host accepts your request, your match will show up here.",
    ],
    Hosted: ["Ready to host?", "Create a match and invite your local community to play."],
    Played: ["Your highlights start here", "After a match, you’ll find it here to look back on."],
    "Saved matches": [
      "Keep a game close",
      "Save a match you like and come back when you’re ready.",
    ],
  };

  return (
    <section className="my-matches-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR GAME PLAN</p>
          <h1>My matches</h1>
          <p>Everything you’ve joined, saved, or hosted.</p>
        </div>
        <button
          type="button"
          className="icon-button page-search-button"
          aria-label={searchOpen ? "Close match search" : "Search your matches"}
          aria-expanded={searchOpen}
          onClick={() => {
            setSearchOpen((open) => !open);
            setQuery("");
          }}
        >
          <Icon name="search" />
        </button>
      </div>
      {searchOpen && (
        <label className="search-input match-search-input">
          <Icon name="search" size={17} />
          <input
            type="search"
            autoFocus
            placeholder="Search your matches"
            aria-label="Search your matches"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className="search-clear"
            aria-label="Close search"
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
            }}
          >
            ×
          </button>
        </label>
      )}
      <div className="match-tabs" role="tablist" aria-label="Your matches">
        {tabs.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "active" : ""}
            onClick={() => dispatch({ type: "SET_MATCH_TAB", tab: item })}
            key={item}
          >
            {item}
            {item === "Requests" && requests.length > 0 && (
              <span className="tab-badge">{requests.length}</span>
            )}
          </button>
        ))}
      </div>
      {tab === "Requests" ? (
        <div className="request-list">
          {requests.length ? (
            requests.map((request) => {
              const match = state.matches.find((item) => item.id === request.matchId);
              if (!match) return null;
              if (request.direction === "incoming")
                return (
                  <article className="incoming-request-card" key={request.id}>
                    <div className="request-card-person">
                      <Avatar name={request.name} />
                      <div>
                        <strong>{request.name}</strong>
                        <small>
                          {request.ageGroup} · {request.skill}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="message-bubble-button"
                        aria-label={`Message ${request.name}`}
                        onClick={() => {
                          dispatch({
                            type: "START_CONVERSATION",
                            id: `conversation-${request.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
                            name: request.name,
                            username: request.username,
                            matchTitle: match.title,
                          });
                        }}
                      >
                        <Icon name="message" size={18} />
                      </button>
                    </div>
                    <div className="request-stats">
                      <span>
                        <Icon name="trophy" size={15} />
                        13 Hosted
                      </span>
                      <span>
                        <Icon name="star" size={15} />
                        4.7
                      </span>
                      <span>{match.sport}</span>
                    </div>
                    <p className="request-match-line">
                      Wants to join <strong>{match.title}</strong>
                    </p>
                    <div className="request-actions">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          dispatch({ type: "RESPOND_TO_REQUEST", id: request.id, accept: false });
                          onToast("Request declined.");
                        }}
                      >
                        Decline
                      </Button>
                      <Button
                        type="button"
                        variant="success"
                        disabled={match.players >= match.capacity}
                        onClick={() => {
                          dispatch({ type: "RESPOND_TO_REQUEST", id: request.id, accept: true });
                          onToast(`${request.name} is in. You can message them from Messages.`);
                        }}
                      >
                        {match.players >= match.capacity ? "Match full" : "Accept"}
                      </Button>
                    </div>
                  </article>
                );
              return (
                <article className="outgoing-request-card" key={request.id}>
                  <div className="request-card-person">
                    <Avatar name={match.host} src={match.hostAvatar} />
                    <div>
                      <strong>{match.host}</strong>
                      <small>Host · {match.ageGroups.join(", ")}</small>
                    </div>
                    <span className="request-status">
                      <Icon name="clock" size={14} />
                      Pending
                    </span>
                  </div>
                  <p>
                    Your request to join <strong>{match.title}</strong> is waiting for a response.
                  </p>
                  <div className="outgoing-request-actions">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => dispatch({ type: "OPEN_MATCH", id: match.id })}
                    >
                      View match
                    </Button>
                    <Button
                      type="button"
                      variant="quiet"
                      onClick={() => {
                        dispatch({ type: "CANCEL_REQUEST", id: request.id });
                        onToast("Your request was cancelled.");
                      }}
                    >
                      Cancel request
                    </Button>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyTab
              title="No open requests"
              copy="Requests you send and receive will show up here."
              onExplore={() => dispatch({ type: "SET_MAIN_TAB", tab: "Home" })}
            />
          )}
        </div>
      ) : visibleItems.length ? (
        <div className="match-grid">
          {visibleItems.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              saved={state.savedMatchIds.includes(match.id)}
              onOpen={() => dispatch({ type: "OPEN_MATCH", id: match.id })}
              onSave={() => dispatch({ type: "TOGGLE_SAVED", id: match.id })}
            />
          ))}
        </div>
      ) : query.trim() ? (
        <EmptyTab
          title="No matches found"
          copy={`Nothing in ${tab.toLowerCase()} matches “${query.trim()}”. Try another search.`}
          onExplore={() => setQuery("")}
        />
      ) : (
        <EmptyTab
          title={emptyCopy[tab][0]}
          copy={emptyCopy[tab][1]}
          onExplore={() => dispatch({ type: "SET_MAIN_TAB", tab: "Home" })}
        />
      )}
    </section>
  );
}

function EmptyTab({
  title,
  copy,
  onExplore,
}: {
  title: string;
  copy: string;
  onExplore: () => void;
}) {
  return (
    <div className="empty-state empty-match-tab">
      <div className="empty-emoji">🏟️</div>
      <h2>{title}</h2>
      <p>{copy}</p>
      <Button type="button" onClick={onExplore}>
        Explore matches <Icon name="arrowRight" size={16} />
      </Button>
    </div>
  );
}
