"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { signIn, signUp, DEMO_CREDENTIALS } from "@/lib/auth-api";
import { useAppStore } from "@/lib/app-store";
import { signInSchema, signUpSchema } from "@/lib/validation";

export function AuthScreen({ onToast }: { onToast: (message: string) => void }) {
  const { state, dispatch } = useAppStore();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const signInCredentials =
      mode === "login" ? signInSchema.safeParse({ username: identifier, password }) : null;
    const signUpCredentials =
      mode === "signup" ? signUpSchema.safeParse({ name, email: identifier, password }) : null;
    const validationError =
      signInCredentials && !signInCredentials.success
        ? signInCredentials.error.issues[0]?.message
        : signUpCredentials && !signUpCredentials.success
          ? signUpCredentials.error.issues[0]?.message
          : null;
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      if (signInCredentials?.success) {
        const user = await signIn(signInCredentials.data.username, signInCredentials.data.password);
        dispatch({
          type: "UPDATE_PROFILE",
          profile: {
            ...state.profile,
            name: `${user.firstName} ${user.lastName}`.trim() || user.username,
            username: `@${user.username}`,
            avatar: state.profile.avatar,
          },
        });
        dispatch({ type: "STARTED" });
        onToast(`Welcome back, ${user.firstName}.`);
      } else {
        if (!signUpCredentials?.success) return;
        const [firstName, ...lastParts] = signUpCredentials.data.name.split(/\s+/);
        const user = await signUp({
          email: signUpCredentials.data.email,
          password: signUpCredentials.data.password,
          firstName,
          lastName: lastParts.join(" ") || firstName,
        });
        dispatch({
          type: "UPDATE_PROFILE",
          profile: {
            ...state.profile,
            name: `${user.firstName || firstName} ${user.lastName || lastParts.join(" ")}`.trim(),
            username: `@${user.username}`,
          },
        });
        dispatch({ type: "NAVIGATE", screen: "profile-setup" });
        onToast("Demo profile created. Finish setting it up.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-screen">
      <div className="auth-topline">
        <button
          type="button"
          className="icon-button"
          aria-label="Back"
          onClick={() => dispatch({ type: "NAVIGATE", screen: "onboarding" })}
        >
          <Icon name="arrowLeft" />
        </button>
        <span className="brand-mini">
          hambazi<span>.</span>
        </span>
      </div>
      <div className="auth-intro">
        <span className="auth-symbol">⚽</span>
        <p className="eyebrow">WELCOME TO THE TEAM</p>
        <h1>{mode === "signup" ? "Let’s get you in the game." : "Good to see you again."}</h1>
        <p>Find your people. Play your game.</p>
      </div>
      <div className="auth-card">
        <div className="auth-switch" role="tablist" aria-label="Account access">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Create account
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Log in
          </button>
        </div>
        <form onSubmit={submit} className="form-stack">
          {mode === "signup" && (
            <label className="field">
              <span>Full name</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder="e.g. Jordan Willson"
                minLength={2}
              />
            </label>
          )}
          <label className="field">
            <span>{mode === "signup" ? "Email address" : "Username"}</span>
            <input
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete={mode === "signup" ? "email" : "username"}
              placeholder={mode === "signup" ? "you@example.com" : "Enter your username"}
              type={mode === "signup" ? "email" : "text"}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              type="password"
              minLength={mode === "signup" ? 6 : 1}
              placeholder="At least 6 characters"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {mode === "login" && (
            <button
              type="button"
              className="demo-credential"
              onClick={() => {
                setIdentifier(DEMO_CREDENTIALS.username);
                setPassword(DEMO_CREDENTIALS.password);
                setError("");
              }}
            >
              <Icon name="help" size={16} /> Fill demo credentials <span>emilys / emilyspass</span>
            </button>
          )}
          <Button type="submit" className="button-large" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" /> Connecting…
              </>
            ) : mode === "signup" ? (
              "Create account"
            ) : (
              "Log in"
            )}
          </Button>
        </form>
        {mode === "signup" && (
          <p className="api-note">
            Demo sign-up uses DummyJSON. New accounts are simulated by that service and are not
            saved there.
          </p>
        )}
        <div className="auth-divider">
          <span />
          or
          <span />
        </div>
        <Button
          type="button"
          variant="outline"
          className="guest-button"
          onClick={() => {
            dispatch({ type: "STARTED" });
            onToast("You’re exploring as a guest. Your changes stay on this device.");
          }}
        >
          Continue as guest
        </Button>
        <p className="auth-privacy">
          By continuing, you agree to the demo experience. No payment details are collected.
        </p>
      </div>
    </section>
  );
}
