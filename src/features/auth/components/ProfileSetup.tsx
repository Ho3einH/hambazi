"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SPORTS, type AgeGroup, type Profile, type SkillLevel, type Sport } from "@/lib/domain";
import { useAppStore } from "@/lib/app-store";
import { getApproximateDemoCity } from "@/lib/geolocation";

const ageGroups: { label: AgeGroup; note: string }[] = [
  { label: "Under 18", note: "Junior" },
  { label: "18–30", note: "Young adult" },
  { label: "30–45", note: "Adult" },
  { label: "+45", note: "Senior" },
];
const skills: { label: Exclude<SkillLevel, "All levels">; note: string; glyph: string }[] = [
  { label: "Beginner", note: "Still learning", glyph: "🌱" },
  { label: "Intermediate", note: "Play regularly", glyph: "🔥" },
  { label: "Advanced", note: "Play at high level", glyph: "⚡" },
];

export function ProfileSetup() {
  const { state, dispatch } = useAppStore();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Profile>(state.profile);
  const [photo, setPhoto] = useState(profile.avatar ?? "");
  const [sportSkills, setSportSkills] = useState<Partial<Record<Sport, SkillLevel>>>(
    profile.skillBySport,
  );
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const chosenSports = useMemo(() => profile.sports, [profile.sports]);

  function toggleSport(sport: Sport) {
    setProfile((current) => ({
      ...current,
      sports: current.sports.includes(sport)
        ? current.sports.filter((item) => item !== sport)
        : [...current.sports, sport],
    }));
  }
  function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      setError("Choose an image smaller than 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhoto(reader.result);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  }
  function next() {
    if (step === 1 && profile.name.trim().length < 2) {
      setError("Add your name so other players can recognise you.");
      return;
    }
    if (step === 2 && !profile.city.trim()) {
      setError("Choose a city to find nearby matches.");
      return;
    }
    if (step === 3 && !profile.sports.length) {
      setError("Choose at least one sport.");
      return;
    }
    if (step === 4 && chosenSports.some((sport) => !sportSkills[sport])) {
      setError("Choose your skill level for each selected sport.");
      return;
    }
    setError("");
    if (step < 5) setStep((value) => value + 1);
    else {
      dispatch({
        type: "UPDATE_PROFILE",
        profile: { ...profile, avatar: photo || undefined, skillBySport: sportSkills },
      });
      dispatch({ type: "SET_LOCATION", city: profile.city });
      dispatch({ type: "STARTED" });
    }
  }

  return (
    <section className="setup-screen">
      <div className="setup-top">
        <button
          type="button"
          className="icon-button"
          aria-label="Previous step"
          onClick={() =>
            step > 1 ? setStep(step - 1) : dispatch({ type: "NAVIGATE", screen: "auth" })
          }
        >
          <Icon name="arrowLeft" />
        </button>
        <span>{step} of 5</span>
      </div>
      <div className="setup-progress">
        <span style={{ width: `${step * 20}%` }} />
      </div>
      <div className="setup-heading">
        <p className="eyebrow">MAKE IT YOURS</p>
        <h1>
          {
            [
              "Your photo",
              "Where are you?",
              "Which sports do you play?",
              "Your skill level",
              "Your age group",
            ][step - 1]
          }
        </h1>
        <p>
          {
            [
              "Help other players recognise you",
              "We’ll show matches in your city",
              "Pick one or more sports",
              `Tell us how you play ${chosenSports.join(" and ").toLowerCase()}`,
              "Find the right players for your games",
            ][step - 1]
          }
        </p>
      </div>
      {step === 1 && (
        <div className="setup-form">
          <label className="photo-upload">
            {photo ? (
              <Image src={photo} alt="Your selected profile" width={92} height={92} unoptimized />
            ) : (
              <>
                <Icon name="user" size={25} />
                <span>Add photo</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={uploadPhoto} />
          </label>
          <label className="field">
            <span>Full name</span>
            <input
              value={profile.name}
              onChange={(event) => setProfile({ ...profile, name: event.target.value })}
              autoComplete="name"
            />
          </label>
        </div>
      )}
      {step === 2 && (
        <div className="setup-form">
          <label className="field">
            <span>City</span>
            <input
              value={profile.city}
              onChange={(event) => setProfile({ ...profile, city: event.target.value })}
              autoComplete="address-level2"
              placeholder="Search your city"
            />
          </label>
          <button
            type="button"
            className="location-detect"
            disabled={locationLoading || !state.preferences.approximateLocation}
            onClick={() => {
              if (!state.preferences.approximateLocation) {
                setError("Enable Approximate location in Settings to use this option.");
                return;
              }
              setLocationLoading(true);
              setError("");
              void getApproximateDemoCity()
                .then((city) => setProfile((current) => ({ ...current, city })))
                .catch((cause: unknown) =>
                  setError(cause instanceof Error ? cause.message : "Choose a city manually."),
                )
                .finally(() => setLocationLoading(false));
            }}
          >
            <Icon name="pin" size={17} />
            {locationLoading ? "Finding your city…" : "Use my location"}
          </button>
          {!state.preferences.approximateLocation && (
            <p className="setup-location-note">
              Approximate location is turned off. Choose a city manually or enable it in Settings.
            </p>
          )}
          <div className="city-list">
            {["London", "Liverpool", "Bristol"].map((city) => (
              <button type="button" key={city} onClick={() => setProfile({ ...profile, city })}>
                <Icon name="pin" size={16} />
                {city}
                <span>{profile.city === city ? "✓" : ""}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="sport-grid setup-sport-grid">
          {SPORTS.map(({ name, emoji }) => (
            <button
              type="button"
              key={name}
              className={`sport-tile ${profile.sports.includes(name) ? "selected" : ""}`}
              aria-pressed={profile.sports.includes(name)}
              onClick={() => toggleSport(name)}
            >
              <span>{emoji}</span>
              {name}
            </button>
          ))}
        </div>
      )}
      {step === 4 && (
        <div className="skill-list">
          {chosenSports.map((sport) => (
            <section key={sport} className="skill-choice">
              <h2>
                {SPORTS.find((item) => item.name === sport)?.emoji} {sport}
              </h2>
              <div>
                {skills.map((skill) => (
                  <button
                    type="button"
                    key={skill.label}
                    className={sportSkills[sport] === skill.label ? "selected" : ""}
                    aria-pressed={sportSkills[sport] === skill.label}
                    onClick={() => setSportSkills({ ...sportSkills, [sport]: skill.label })}
                  >
                    <span className="skill-glyph">{skill.glyph}</span>
                    <span>
                      <strong>{skill.label}</strong>
                      <small>{skill.note}</small>
                    </span>
                    <span className="radio-mark" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {step === 5 && (
        <div className="age-list">
          {ageGroups.map(({ label, note }) => (
            <button
              type="button"
              key={label}
              className={profile.ageGroup === label ? "selected" : ""}
              aria-pressed={profile.ageGroup === label}
              onClick={() => setProfile({ ...profile, ageGroup: label })}
            >
              <span>
                <strong>{label}</strong>
                <small>{note}</small>
              </span>
              <span className="radio-mark" />
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="form-error setup-error" role="alert">
          {error}
        </p>
      )}
      <div className="setup-footer">
        <Button className="button-large" onClick={next}>
          {step === 5 ? "Find matches" : "Continue"}
          <Icon name="arrowRight" size={18} />
        </Button>
        {step === 1 && (
          <button type="button" className="skip-link" onClick={() => setStep(2)}>
            Skip for now
          </button>
        )}
      </div>
    </section>
  );
}
