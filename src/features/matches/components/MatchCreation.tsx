"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  SPORTS,
  type Access,
  type AgeGroup,
  type AppState,
  type Match,
  type SkillLevel,
  type Sport,
} from "@/lib/domain";
import { useAppStore } from "@/lib/app-store";
import { matchDraftSchema } from "@/lib/validation";
import { getCityMapEmbedUrl } from "@/lib/maps";

const skillOptions: SkillLevel[] = ["Beginner", "Intermediate", "Advanced", "All levels"];
const ageOptions: AgeGroup[] = ["Under 18", "18–30", "30–45", "+45", "All ages"];
const venues = [
  { city: "London", venue: "St Augustine’s Sports Centre", address: "Oxford Road, London NW6 5AW" },
  { city: "London", venue: "Regent’s Park Courts", address: "Inner Circle, Regent’s Park, London" },
  { city: "London", venue: "Camden Sports Hall", address: "Kings Cross Road, Camden, London" },
  {
    city: "Liverpool",
    venue: "Wavertree Sports Park",
    address: "Wavertree Road, Liverpool L15 4LE",
  },
  { city: "Bristol", venue: "Easton Leisure Centre", address: "Thrissell Street, Bristol BS5 0SW" },
];
function localDate(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function MatchCreation({ state, onBack }: { state: AppState; onBack: () => void }) {
  const { dispatch } = useAppStore();
  const originalMatch = state.editingMatchId
    ? state.matches.find((match) => match.id === state.editingMatchId)
    : undefined;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [sport, setSport] = useState<Sport | "">(originalMatch?.sport ?? "");
  const [format, setFormat] = useState<"Players" | "Team" | "">(originalMatch?.format ?? "");
  const [title, setTitle] = useState(originalMatch?.title ?? "");
  const [capacity, setCapacity] = useState(originalMatch?.capacity ?? 10);
  const [duration, setDuration] = useState(originalMatch?.duration ?? 90);
  const [fee, setFee] = useState(String(originalMatch?.fee ?? 0));
  const [venue, setVenue] = useState(originalMatch?.venue ?? "");
  const [address, setAddress] = useState(originalMatch?.address ?? "");
  const [date, setDate] = useState(originalMatch?.date ?? localDate(tomorrow));
  const [time, setTime] = useState(originalMatch?.time ?? "17:30");
  const [skills, setSkills] = useState<SkillLevel[]>(originalMatch?.skillLevels ?? []);
  const [ages, setAges] = useState<AgeGroup[]>(originalMatch?.ageGroups ?? ["All ages"]);
  const [access, setAccess] = useState<Access>(originalMatch?.access ?? "Public");
  const [description, setDescription] = useState(originalMatch?.description ?? "");
  const [venuePicker, setVenuePicker] = useState(false);
  const [error, setError] = useState("");
  const selectedVenue = useMemo(() => venues.find((item) => item.venue === venue), [venue]);
  const cityVenues = useMemo(
    () =>
      venues.filter(
        (item) => item.city.toLowerCase() === (originalMatch?.city ?? state.location).toLowerCase(),
      ),
    [originalMatch?.city, state.location],
  );

  function toggle<T extends string>(values: T[], value: T) {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  }
  function selectVenue(item: (typeof venues)[number]) {
    setVenue(item.venue);
    setAddress(item.address);
    setVenuePicker(false);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = matchDraftSchema.safeParse({
      sport,
      format,
      title,
      capacity,
      duration,
      fee: Number(fee || 0),
      venue,
      address,
      city: originalMatch?.city ?? state.location,
      date,
      time,
      skillLevels: skills,
      ageGroups: ages,
      access,
      description,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the match details and try again.");
      return;
    }
    if (originalMatch && parsed.data.capacity < originalMatch.players) {
      setError(
        `Capacity must include the ${originalMatch.players} players who have already joined.`,
      );
      return;
    }
    setError("");
    const match: Match = {
      id: originalMatch?.id ?? `match-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...parsed.data,
      players: originalMatch?.players ?? 1,
      host: originalMatch?.host ?? state.profile.name,
      hostHandle: originalMatch?.hostHandle ?? state.profile.username,
      hostAvatar: originalMatch?.hostAvatar ?? state.profile.avatar,
    };
    if (originalMatch) dispatch({ type: "UPDATE_MATCH", match });
    else dispatch({ type: "CREATE_MATCH", match });
  }

  return (
    <section className="create-match-page">
      <header className="flow-header">
        <button
          type="button"
          className="icon-button"
          aria-label={originalMatch ? "Cancel editing" : "Cancel match creation"}
          onClick={onBack}
        >
          <Icon name="close" />
        </button>
        <h1>{originalMatch ? "Edit match" : "Match creation"}</h1>
        <span className="step-label">{originalMatch ? "Update game" : "New game"}</span>
      </header>
      <form className="create-match-form" onSubmit={submit}>
        <section className="create-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">STEP 1</p>
              <h2>Choose your sport</h2>
            </div>
          </div>
          <div className="sport-grid">
            {SPORTS.map(({ name, emoji }) => (
              <button
                type="button"
                key={name}
                className={`sport-tile ${sport === name ? "selected" : ""}`}
                aria-pressed={sport === name}
                onClick={() => setSport(name)}
              >
                <span>{emoji}</span>
                {name}
              </button>
            ))}
          </div>
        </section>
        <section className="create-section">
          <h2>Who can join?</h2>
          <div className="format-grid">
            {(["Players", "Team"] as const).map((item) => (
              <button
                type="button"
                key={item}
                className={`format-card ${format === item ? "selected" : ""}`}
                aria-pressed={format === item}
                onClick={() => setFormat(item)}
              >
                <span>{item === "Players" ? "🧍" : "🧑‍🤝‍🧑"}</span>
                <strong>{item}</strong>
                <small>
                  {item === "Players"
                    ? "Individuals can join your match"
                    : "Only teams can join your match"}
                </small>
              </button>
            ))}
          </div>
        </section>
        <section className="create-section">
          <p className="eyebrow">STEP 2</p>
          <h2>Match details</h2>
          <label className="field">
            <span>Match name</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={70}
              placeholder="e.g. Sunday football"
            />
          </label>
          <div className="number-control">
            <span>Maximum players</span>
            <div>
              <button
                type="button"
                aria-label="Remove one player"
                disabled={capacity <= Math.max(2, originalMatch?.players ?? 2)}
                onClick={() => setCapacity(Math.max(2, originalMatch?.players ?? 2, capacity - 1))}
              >
                −
              </button>
              <output>{capacity}</output>
              <button
                type="button"
                aria-label="Add one player"
                disabled={capacity >= 30}
                onClick={() => setCapacity(Math.min(30, capacity + 1))}
              >
                ＋
              </button>
            </div>
          </div>
          <div className="number-control">
            <span>Duration</span>
            <div>
              <button
                type="button"
                aria-label="Shorten by 15 minutes"
                disabled={duration <= 30}
                onClick={() => setDuration(Math.max(30, duration - 15))}
              >
                −
              </button>
              <output>{duration} min</output>
              <button
                type="button"
                aria-label="Add 15 minutes"
                disabled={duration >= 240}
                onClick={() => setDuration(Math.min(240, duration + 15))}
              >
                ＋
              </button>
            </div>
          </div>
          <label className="field">
            <span>Entry fee (£ per player)</span>
            <div className="input-with-prefix">
              <span>£</span>
              <input
                type="number"
                min="0"
                max="500"
                step="0.5"
                value={fee}
                onChange={(event) => setFee(event.target.value)}
              />
            </div>
          </label>
        </section>
        <section className="create-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">STEP 3</p>
              <h2>Pick your venue</h2>
            </div>
            <button
              type="button"
              className="text-link"
              onClick={() => setVenuePicker(!venuePicker)}
            >
              Choose nearby
            </button>
          </div>
          <label className="field">
            <span>Court or venue</span>
            <input
              value={venue}
              onChange={(event) => {
                setVenue(event.target.value);
                setVenuePicker(true);
              }}
              onFocus={() => setVenuePicker(true)}
              required
              placeholder="Search for a venue"
            />
          </label>
          {venuePicker && (
            <div className="venue-suggestions">
              {cityVenues
                .filter(
                  (item) =>
                    !venue ||
                    item.venue.toLowerCase().includes(venue.toLowerCase()) ||
                    item.address.toLowerCase().includes(venue.toLowerCase()),
                )
                .map((item) => (
                  <button type="button" key={item.venue} onClick={() => selectVenue(item)}>
                    <Icon name="pin" size={17} />
                    <span>
                      <strong>{item.venue}</strong>
                      <small>{item.address}</small>
                    </span>
                  </button>
                ))}
            </div>
          )}
          <label className="field">
            <span>Address</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
              placeholder="Street and area"
            />
          </label>
          <div className="map-preview create-map">
            <iframe
              title={`Approximate city map for ${originalMatch?.city ?? state.location}`}
              loading="lazy"
              src={getCityMapEmbedUrl(originalMatch?.city ?? state.location)}
            />
            <span className="map-caption">
              <Icon name="pin" size={16} />
              {selectedVenue?.venue ?? `Map centered on ${originalMatch?.city ?? state.location}`}
            </span>
          </div>
        </section>
        <section className="create-section">
          <p className="eyebrow">STEP 4</p>
          <h2>Date and time</h2>
          <div className="field-grid">
            <label className="field">
              <span>Date</span>
              <input
                type="date"
                value={date}
                min={localDate(new Date())}
                required
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Start time</span>
              <input
                type="time"
                value={time}
                required
                onChange={(event) => setTime(event.target.value)}
              />
            </label>
          </div>
        </section>
        <section className="create-section">
          <h2>Skill level</h2>
          <div className="choice-row">
            {skillOptions.map((item) => (
              <button
                type="button"
                className={`choice-pill ${skills.includes(item) ? "selected" : ""}`}
                aria-pressed={skills.includes(item)}
                key={item}
                onClick={() =>
                  setSkills(
                    item === "All levels"
                      ? skills.includes(item)
                        ? []
                        : [item]
                      : toggle(
                          skills.filter((skill) => skill !== "All levels"),
                          item,
                        ),
                  )
                }
              >
                {item}
                {skills.includes(item) && <Icon name="check" size={14} />}
              </button>
            ))}
          </div>
        </section>
        <section className="create-section">
          <h2>Age group</h2>
          <div className="choice-row">
            {ageOptions.map((item) => (
              <button
                type="button"
                className={`choice-pill ${ages.includes(item) ? "selected" : ""}`}
                aria-pressed={ages.includes(item)}
                key={item}
                onClick={() =>
                  setAges(
                    item === "All ages"
                      ? ages.includes(item)
                        ? []
                        : [item]
                      : toggle(
                          ages.filter((age) => age !== "All ages"),
                          item,
                        ),
                  )
                }
              >
                {item}
              </button>
            ))}
          </div>
        </section>
        <section className="create-section">
          <h2>Match access</h2>
          <div className="access-toggle" role="group" aria-label="Match visibility">
            {(["Public", "Private"] as const).map((item) => (
              <button
                type="button"
                key={item}
                className={access === item ? "selected" : ""}
                aria-pressed={access === item}
                onClick={() => setAccess(item)}
              >
                <Icon name={item === "Public" ? "users" : "user"} size={17} />
                {item}
                <small>
                  {item === "Public" ? "Anyone can find and request" : "Invite-only match"}
                </small>
              </button>
            ))}
          </div>
        </section>
        <section className="create-section">
          <h2>About this match</h2>
          <label className="field">
            <span>
              Description <small>{description.length}/240</small>
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={240}
              placeholder="Add notes, rules or anything players should know…"
              rows={4}
            />
          </label>
        </section>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="create-footer">
          <Button type="submit" className="button-large">
            {originalMatch ? "Save changes" : "Publish match"} <Icon name="arrowRight" size={18} />
          </Button>
          <p>Your game will be visible to players in {originalMatch?.city ?? state.location}.</p>
        </div>
      </form>
    </section>
  );
}
