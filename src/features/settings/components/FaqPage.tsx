"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAppStore } from "@/lib/app-store";

const categories = ["Getting started", "Joining a match", "Creating & hosting"] as const;
type Category = (typeof categories)[number];
const questions: Record<Category, { q: string; a: string }[]> = {
  "Getting started": [
    {
      q: "What is Hambazi and how does it work?",
      a: "Hambazi helps you find and join local sports matches — or create your own. Browse nearby games, filter by sport, skill level and age group, then ask to join in a tap. Hosts set the details and manage who joins.",
    },
    {
      q: "How do I set up my profile and add sports?",
      a: "Open More → My profile → Edit profile. Add your name, city, sports and a short note so other players know what to expect.",
    },
    {
      q: "How do I find matches near me?",
      a: "Choose a city from the top of Home, then use sport chips or Filters to narrow games by date, time, skill, age group and availability.",
    },
  ],
  "Joining a match": [
    {
      q: "How do I join a match?",
      a: "Open a match, review its venue and details, then tap Send request. The host can accept or decline; accepted matches appear under Upcoming.",
    },
    {
      q: "What does approval required mean?",
      a: "The host reviews requests before confirming players. Your place is only confirmed after they accept.",
    },
    {
      q: "How do I know if my request was accepted?",
      a: "You’ll see the status in My matches → Requests. In the full service, a notification would also be sent.",
    },
    {
      q: "Can I cancel a request I sent?",
      a: "Yes. Open My matches → Requests and choose Cancel request, or open the match and cancel it there.",
    },
    {
      q: "Can I join a match as a team?",
      a: "Yes. Team matches are labelled on the card. Open the match details to check the host’s joining rules.",
    },
    {
      q: "What happens if the match is full?",
      a: "The join request button is disabled when all places are taken. You can save the match or message the host.",
    },
    {
      q: "How do I leave a match I already joined?",
      a: "Go to My matches → Upcoming, open the game and use Leave match. Please let the host know as early as possible.",
    },
  ],
  "Creating & hosting": [
    {
      q: "How do I create a match?",
      a: "Tap the purple Create match button, add the sport, venue, time, capacity and joining preferences, then publish. Your game appears in Home and My matches → Hosted.",
    },
    {
      q: "Can I make my match private?",
      a: "Yes. Choose Private in the creation form. The demo marks it invite-only; a production backend would enforce access control.",
    },
    {
      q: "Can I edit or cancel my match?",
      a: "Open your match from My matches → Hosted. Choose Edit match to update it, or Cancel match to remove it from this device. Cancelling also removes its local requests and saved references.",
    },
    {
      q: "Are payments processed in the app?",
      a: "No. Entry fees are informational in this demo. Hambazi does not collect payments.",
    },
  ],
};

export function FaqPage({ onBack }: { onBack: () => void }) {
  const { dispatch } = useAppStore();
  const [category, setCategory] = useState<Category>(categories[0]);
  const [query, setQuery] = useState("");
  const [openQuestion, setOpenQuestion] = useState<string | null>(questions[categories[0]][0].q);
  const filtered = useMemo(
    () =>
      categories.flatMap((group) =>
        questions[group]
          .filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(query.toLowerCase()))
          .map((item) => ({ ...item, category: group })),
      ),
    [query],
  );
  const visible = query ? filtered : questions[category].map((item) => ({ ...item, category }));
  return (
    <section className="faq-page">
      <header className="flow-header">
        <button
          type="button"
          className="icon-button"
          aria-label="Back to settings"
          onClick={onBack}
        >
          <Icon name="arrowLeft" />
        </button>
        <h1>Help & FAQ</h1>
        <button
          type="button"
          className="icon-button"
          aria-label="Open messages"
          onClick={() => dispatch({ type: "SET_MAIN_TAB", tab: "Messages" })}
        >
          <Icon name="message" />
        </button>
      </header>
      <div className="faq-tabs" role="tablist" aria-label="FAQ categories">
        {categories.map((item) => (
          <button
            type="button"
            role="tab"
            key={item}
            aria-selected={category === item}
            className={category === item && !query ? "active" : ""}
            onClick={() => {
              setCategory(item);
              setQuery("");
              setOpenQuestion(null);
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <label className="search-input faq-search">
        <Icon name="search" size={18} />
        <input
          type="search"
          placeholder="Search help"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="sr-only">Search FAQ</span>
      </label>
      <div className="faq-list">
        {!query && <h2>{category}</h2>}
        {visible.map((item) => (
          <article className="faq-item" key={item.q}>
            <button
              type="button"
              aria-expanded={openQuestion === item.q}
              onClick={() => setOpenQuestion(openQuestion === item.q ? null : item.q)}
            >
              <span>{item.q}</span>
              <Icon
                name="chevronDown"
                size={17}
                className={openQuestion === item.q ? "rotated" : ""}
              />
            </button>
            {openQuestion === item.q && <p>{item.a}</p>}
          </article>
        ))}
        {!visible.length && (
          <div className="empty-state">
            <h3>No answers found</h3>
            <p>Try another search phrase.</p>
          </div>
        )}
      </div>
      <aside className="faq-contact">
        <span>
          <strong>Still need help?</strong>
          <small>Support messaging isn’t connected in this local demo.</small>
        </span>
        <Icon name="arrowRight" />
      </aside>
    </section>
  );
}
