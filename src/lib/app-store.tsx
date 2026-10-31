"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { appReducer } from "@/lib/app-reducer";
import type { AppAction, AppState, PersistedAppData } from "@/lib/domain";
import { createInitialState } from "@/lib/seed-data";
import { persistedAppDataSchema } from "@/lib/validation";

const STORAGE_KEY = "hambazi-app-v2";

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  ready: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStore({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : null;
      const result = persistedAppDataSchema.safeParse(parsed);
      dispatch({ type: "HYDRATE", payload: result.success ? result.data : null });
    } catch {
      dispatch({ type: "HYDRATE", payload: null });
    }
    // Hydration is intentionally gated until browser-only preferences are loaded.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const persisted: PersistedAppData = {
      hasStarted: state.hasStarted,
      profile: state.profile,
      location: state.location,
      matches: state.matches,
      requests: state.requests,
      savedMatchIds: state.savedMatchIds,
      hostedMatchIds: state.hostedMatchIds,
      acceptedMatchIds: state.acceptedMatchIds,
      playedMatchIds: state.playedMatchIds,
      blockedUsers: state.blockedUsers,
      conversations: state.conversations,
      preferences: state.preferences,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // Keep the app usable when storage is disabled or full.
    }
  }, [state, ready]);

  const value = useMemo(() => ({ state, dispatch, ready }), [state, ready]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useAppStore must be used inside AppStore");
  return value;
}
