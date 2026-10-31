"use client";

import Image from "next/image";
import { useState } from "react";
import "@/features/auth/auth.css";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAppStore } from "@/lib/app-store";

const slides = [
  {
    eyebrow: "YOUR LOCAL SPORTS COMMUNITY",
    title: (
      <>
        Find the matches
        <br />
        that you want.
      </>
    ),
    copy: "Browse local sports matches filtered by sport, skill level, and age group.",
  },
  {
    eyebrow: "PLAY TOGETHER",
    title: (
      <>
        Join or host
        <br />a match.
      </>
    ),
    copy: "Create your own match or join one in a tap. Teams or solo — your call.",
  },
  {
    eyebrow: "YOUR KIND OF GAME",
    title: (
      <>
        Play with the
        <br />
        right people.
      </>
    ),
    copy: "Find players who match your level, age group, and energy.",
  },
];

export function OnboardingScreen() {
  const [slide, setSlide] = useState(0);
  const { dispatch } = useAppStore();
  const current = slides[slide];

  return (
    <section className="welcome-screen">
      <header className="welcome-header">
        <span className="brand-mark">
          h<span>.</span>
        </span>
        <span className="welcome-wordmark">hambazi</span>
        <button
          type="button"
          className="text-link"
          onClick={() => dispatch({ type: "NAVIGATE", screen: "auth" })}
        >
          Skip
        </button>
      </header>
      <div className="welcome-art">
        <div className="art-orbit art-orbit-one" />
        <div className="art-orbit art-orbit-two" />
        <div className="art-caption">
          <span>GOOD GAMES</span>
          <strong>
            Happen when
            <br />
            you show up.
          </strong>
          <span className="art-caption-ball">{slide === 1 ? "🏸" : slide === 2 ? "🏀" : "⚽"}</span>
        </div>
        <Image
          src="/art/player-location.webp"
          alt="A player finding a place to play"
          width={650}
          height={754}
          priority
          className="welcome-player"
        />
        <div className="art-location">
          <Icon name="pin" size={16} /> London · games nearby
        </div>
      </div>
      <div className="welcome-copy">
        <div className="welcome-dots" role="group" aria-label="Welcome screens">
          {slides.map((item, index) => (
            <button
              key={item.eyebrow}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              aria-pressed={slide === index}
              className={slide === index ? "selected" : ""}
              onClick={() => setSlide(index)}
            />
          ))}
        </div>
        <p className="eyebrow">{current.eyebrow}</p>
        <h1>{current.title}</h1>
        <p className="welcome-description">{current.copy}</p>
      </div>
      <div className="welcome-actions">
        <Button
          className="button-large"
          onClick={() => dispatch({ type: "NAVIGATE", screen: "auth" })}
        >
          Get started <Icon name="arrowRight" size={19} />
        </Button>
        <p>
          Already have an account?{" "}
          <button
            type="button"
            className="text-link"
            onClick={() => dispatch({ type: "NAVIGATE", screen: "auth" })}
          >
            Log in
          </button>
        </p>
        <button type="button" className="guest-link" onClick={() => dispatch({ type: "STARTED" })}>
          Explore as a guest
        </button>
      </div>
    </section>
  );
}
