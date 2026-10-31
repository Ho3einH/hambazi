"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MatchCard } from "@/features/matches/components/MatchCard";
import type { Match } from "@/lib/domain";
import { SPORTS } from "@/lib/domain";
import { useAppStore } from "@/lib/app-store";

export function MatchSuccess({
  match,
  updated,
  onToast,
}: {
  match: Match;
  updated: boolean;
  onToast: (message: string) => void;
}) {
  const { dispatch } = useAppStore();
  const sportEmoji = SPORTS.find((sport) => sport.name === match.sport)?.emoji ?? "🏟️";
  async function invite() {
    const url = `${window.location.origin}${window.location.pathname}#match=${encodeURIComponent(match.id)}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: match.title,
          text: `Join my ${match.sport} match at ${match.venue}`,
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        onToast("Match link copied. Send it to your players.");
      }
    } catch {
      onToast("Sharing was cancelled.");
    }
  }
  return (
    <section className="success-page">
      <div className="success-art">
        <span className="success-spark spark-one">✦</span>
        <span className="success-ball">{sportEmoji}</span>
        <span className="success-check">
          <Icon name="check" size={30} />
        </span>
      </div>
      <p className="eyebrow">{updated ? "MATCH UPDATED" : "YOU’RE ON THE BOARD"}</p>
      <h1>{updated ? "Changes saved" : "Match created!"}</h1>
      <p className="success-copy">
        {updated
          ? "Your match details are up to date."
          : "Your match is live. Players can now discover and request to join your game."}
      </p>
      <div className="success-match-card">
        <MatchCard
          match={match}
          saved={false}
          onOpen={() => dispatch({ type: "OPEN_MATCH", id: match.id })}
        />
      </div>
      <div className="success-actions">
        <Button
          className="button-large"
          onClick={() => dispatch({ type: "OPEN_MATCH", id: match.id })}
        >
          View match details <Icon name="arrowRight" size={18} />
        </Button>
        <Button variant="outline" className="button-large" onClick={() => void invite()}>
          <Icon name="share" size={17} />
          Invite players
        </Button>
        <button
          type="button"
          className="text-link"
          onClick={() => dispatch({ type: "EDIT_MATCH", id: match.id })}
        >
          Edit match
        </button>
        <button
          type="button"
          className="text-link"
          onClick={() => dispatch({ type: "SET_MAIN_TAB", tab: "Home" })}
        >
          Back to home
        </button>
      </div>
    </section>
  );
}
