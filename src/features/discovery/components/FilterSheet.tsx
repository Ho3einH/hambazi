"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { AgeGroup, Match, SkillLevel, Sport } from "@/lib/domain";
import { SPORTS } from "@/lib/domain";

export interface MatchFilters {
  sport: Sport | "All sports";
  dateFrom: string;
  dateTo: string;
  time: string[];
  capacity: [number, number];
  openSpots: [number, number];
  skills: string[];
  ages: string[];
  sort: "Newest" | "Starting soon" | "Filling up fast" | "Most spots left";
}

export const EMPTY_FILTERS: MatchFilters = {
  sport: "All sports",
  dateFrom: "",
  dateTo: "",
  time: [],
  capacity: [2, 20],
  openSpots: [1, 20],
  skills: [],
  ages: [],
  sort: "Starting soon",
};

const times = ["Morning", "Day", "Evening", "Night", "All day"];
const skills: SkillLevel[] = ["Beginner", "Intermediate", "Advanced", "All levels"];
const ages: AgeGroup[] = ["Under 18", "18–30", "30–45", "+45", "All ages"];
const sortOptions: MatchFilters["sort"][] = [
  "Newest",
  "Starting soon",
  "Filling up fast",
  "Most spots left",
];

function inTimeBand(time: string, band: string) {
  if (band === "All day") return true;
  const hour = Number(time.split(":")[0]);
  return band === "Morning"
    ? hour >= 5 && hour < 12
    : band === "Day"
      ? hour >= 12 && hour < 17
      : band === "Evening"
        ? hour >= 17 && hour < 22
        : hour >= 22 || hour < 5;
}

export function filterMatches(matches: Match[], filters: MatchFilters, query = "") {
  const term = query.trim().toLowerCase();
  const filtered = matches.filter((match) => {
    const searchText =
      `${match.title} ${match.sport} ${match.venue} ${match.address} ${match.host}`.toLowerCase();
    const open = match.capacity - match.players;
    const hasSkill =
      !filters.skills.length ||
      filters.skills.includes("All levels") ||
      filters.skills.some((skill) => match.skillLevels.includes(skill as SkillLevel));
    const hasAge =
      !filters.ages.length ||
      filters.ages.includes("All ages") ||
      filters.ages.some((age) => match.ageGroups.includes(age as AgeGroup));
    const timeOkay =
      !filters.time.length || filters.time.some((band) => inTimeBand(match.time, band));
    return (
      (filters.sport === "All sports" || filters.sport === match.sport) &&
      (!term || searchText.includes(term)) &&
      (!filters.dateFrom || match.date >= filters.dateFrom) &&
      (!filters.dateTo || match.date <= filters.dateTo) &&
      timeOkay &&
      match.capacity >= filters.capacity[0] &&
      match.capacity <= filters.capacity[1] &&
      open >= filters.openSpots[0] &&
      open <= filters.openSpots[1] &&
      hasSkill &&
      hasAge
    );
  });
  return filtered.sort((a, b) => {
    if (filters.sort === "Newest") return b.date.localeCompare(a.date);
    if (filters.sort === "Filling up fast")
      return a.capacity - a.players - (b.capacity - b.players);
    if (filters.sort === "Most spots left")
      return b.capacity - b.players - (a.capacity - a.players);
    return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
  });
}

export function FilterSheet({
  open,
  value,
  count,
  onClose,
  onApply,
}: {
  open: boolean;
  value: MatchFilters;
  count: number;
  onClose: () => void;
  onApply: (filters: MatchFilters) => void;
}) {
  const [filters, setFilters] = useState(value);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);
  if (!open) return null;
  const toggle = <T extends string>(items: T[], item: T) =>
    items.includes(item) ? items.filter((entry) => entry !== item) : [...items, item];

  return (
    <div
      className="sheet-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="filter-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-title"
      >
        <div className="sheet-grabber" />
        <header className="sheet-header">
          <button
            type="button"
            className="icon-button"
            aria-label="Close filters"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
          <h2 id="filter-title">Filter matches</h2>
          <button type="button" className="text-link" onClick={() => setFilters(EMPTY_FILTERS)}>
            Reset
          </button>
        </header>
        <div className="sheet-scroll">
          <section className="filter-section">
            <h3>Sort by</h3>
            <div className="choice-row">
              {sortOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`choice-pill ${filters.sort === option ? "selected" : ""}`}
                  aria-pressed={filters.sort === option}
                  onClick={() => setFilters({ ...filters, sort: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>
          <section className="filter-section">
            <h3>Sport</h3>
            <div className="sport-grid compact-sport-grid">
              {SPORTS.map(({ name, emoji }) => (
                <button
                  key={name}
                  type="button"
                  className={`sport-tile ${filters.sport === name ? "selected" : ""}`}
                  aria-pressed={filters.sport === name}
                  onClick={() =>
                    setFilters({ ...filters, sport: filters.sport === name ? "All sports" : name })
                  }
                >
                  <span>{emoji}</span>
                  {name}
                </button>
              ))}
            </div>
          </section>
          <section className="filter-section">
            <h3>Date</h3>
            <div className="filter-date-row">
              <label className="field">
                <span>From</span>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })}
                />
              </label>
              <label className="field">
                <span>To</span>
                <input
                  type="date"
                  min={filters.dateFrom || undefined}
                  value={filters.dateTo}
                  onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })}
                />
              </label>
            </div>
          </section>
          <section className="filter-section">
            <h3>Time</h3>
            <div className="choice-row">
              {times.map((time) => (
                <button
                  type="button"
                  className={`choice-pill ${filters.time.includes(time) ? "selected" : ""}`}
                  aria-pressed={filters.time.includes(time)}
                  key={time}
                  onClick={() => setFilters({ ...filters, time: toggle(filters.time, time) })}
                >
                  {time}
                </button>
              ))}
            </div>
          </section>
          <RangeFilter
            label="Capacity"
            value={filters.capacity}
            min={2}
            max={20}
            onChange={(capacity) => setFilters({ ...filters, capacity })}
          />
          <RangeFilter
            label="Open spots"
            value={filters.openSpots}
            min={1}
            max={20}
            onChange={(openSpots) => setFilters({ ...filters, openSpots })}
          />
          <section className="filter-section">
            <h3>Skill level</h3>
            <div className="choice-row">
              {skills.map((skill) => (
                <button
                  type="button"
                  key={skill}
                  className={`choice-pill ${filters.skills.includes(skill) ? "selected" : ""}`}
                  aria-pressed={filters.skills.includes(skill)}
                  onClick={() => setFilters({ ...filters, skills: toggle(filters.skills, skill) })}
                >
                  {skill}
                </button>
              ))}
            </div>
          </section>
          <section className="filter-section">
            <h3>Age group</h3>
            <div className="choice-row">
              {ages.map((age) => (
                <button
                  type="button"
                  key={age}
                  className={`choice-pill ${filters.ages.includes(age) ? "selected" : ""}`}
                  aria-pressed={filters.ages.includes(age)}
                  onClick={() => setFilters({ ...filters, ages: toggle(filters.ages, age) })}
                >
                  {age}
                </button>
              ))}
            </div>
          </section>
        </div>
        <footer className="sheet-footer">
          <Button
            className="button-large"
            onClick={() => {
              onApply(filters);
              onClose();
            }}
          >
            Show {count} {count === 1 ? "match" : "matches"}
            <Icon name="arrowRight" size={18} />
          </Button>
        </footer>
      </section>
    </div>
  );
}

function RangeFilter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: [number, number];
  min: number;
  max: number;
  onChange: (value: [number, number]) => void;
}) {
  return (
    <section className="filter-section">
      <h3>{label}</h3>
      <div className="range-labels">
        <label>
          {value[0]} min
          <input
            aria-label={`${label} minimum`}
            type="range"
            min={min}
            max={max}
            value={value[0]}
            onChange={(event) =>
              onChange([Math.min(Number(event.target.value), value[1]), value[1]])
            }
          />
        </label>
        <label>
          {value[1]} max
          <input
            aria-label={`${label} maximum`}
            type="range"
            min={min}
            max={max}
            value={value[1]}
            onChange={(event) =>
              onChange([value[0], Math.max(Number(event.target.value), value[0])])
            }
          />
        </label>
      </div>
    </section>
  );
}
