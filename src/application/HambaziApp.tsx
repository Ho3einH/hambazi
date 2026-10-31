"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Toast } from "@/components/ui/Toast";
import { AuthScreen } from "@/features/auth/components/AuthScreen";
import { OnboardingScreen } from "@/features/auth/components/OnboardingScreen";
import { ProfileSetup } from "@/features/auth/components/ProfileSetup";
import { HomePage } from "@/features/discovery/components/HomePage";
import { MatchDetail } from "@/features/matches/components/MatchDetail";
import { MatchSuccess } from "@/features/matches/components/MatchSuccess";
import { MatchCreation } from "@/features/matches/components/MatchCreation";
import { MyMatchesPage } from "@/features/matches/components/MyMatchesPage";
import { ChatPage } from "@/features/messaging/components/ChatPage";
import { MessagesPage } from "@/features/messaging/components/MessagesPage";
import { MorePage } from "@/features/profile/components/MorePage";
import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { FaqPage } from "@/features/settings/components/FaqPage";
import { SettingsPage } from "@/features/settings/components/SettingsPage";
import { useAppStore } from "@/lib/app-store";
import { selectVisiblePendingRequests } from "@/lib/selectors";

export function HambaziApp() {
  const { state, dispatch, ready } = useAppStore();
  const [online, setOnline] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const routeSyncStarted = useRef(false);
  const closeToast = useCallback(() => setToastMessage(""), []);
  const showToast = useCallback((message: string) => setToastMessage(message), []);
  const selectedMatch = useMemo(
    () => state.matches.find((match) => match.id === state.selectedMatchId) ?? null,
    [state.matches, state.selectedMatchId],
  );
  const activeConversation = useMemo(
    () =>
      state.conversations.find((conversation) => conversation.id === state.activeChatId) ?? null,
    [state.conversations, state.activeChatId],
  );

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const openFromHash = () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const matchId = params.get("match");
      const profileId = params.get("profile");
      if (matchId && state.matches.some((match) => match.id === matchId))
        dispatch({ type: "OPEN_MATCH", id: matchId });
      else if (profileId)
        dispatch({
          type: "OPEN_PROFILE",
          target: profileId === state.profile.username ? "mine" : "other",
        });
    };
    if (window.location.hash) openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [ready, state.matches, state.profile.username, dispatch]);

  useEffect(() => {
    if (!ready) return;
    if (!routeSyncStarted.current) {
      routeSyncStarted.current = true;
      return;
    }
    if (state.screen === "match-detail" && state.selectedMatchId) {
      window.history.replaceState(null, "", `#match=${encodeURIComponent(state.selectedMatchId)}`);
    } else if (state.screen === "profile" || state.screen === "other-profile") {
      const username = state.screen === "profile" ? state.profile.username : "@mayak";
      window.history.replaceState(null, "", `#profile=${encodeURIComponent(username)}`);
    } else if (
      window.location.hash.startsWith("#match=") ||
      window.location.hash.startsWith("#profile=")
    ) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [ready, state.screen, state.selectedMatchId, state.profile.username]);

  if (!ready)
    return (
      <div className="boot-screen" aria-label="Loading Hambazi">
        <span className="brand-mark">
          h<span>.</span>
        </span>
        <span>hambazi</span>
        <i />
      </div>
    );

  const backToHome = () => dispatch({ type: "SET_MAIN_TAB", tab: "Home" });
  const goProfile = () => dispatch({ type: "OPEN_PROFILE", target: "mine" });
  const openCreate = () => dispatch({ type: "OPEN_MATCH_CREATION" });
  const openRequests = () => {
    dispatch({ type: "SET_MATCH_TAB", tab: "Requests" });
    dispatch({ type: "SET_MAIN_TAB", tab: "My Matches" });
  };
  const pendingRequestCount = selectVisiblePendingRequests(state).length;

  let page: React.ReactNode;
  switch (state.screen) {
    case "onboarding":
      page = <OnboardingScreen />;
      break;
    case "auth":
      page = <AuthScreen onToast={showToast} />;
      break;
    case "profile-setup":
      page = <ProfileSetup />;
      break;
    case "home":
      page = <HomePage state={state} onToast={showToast} onCreate={openCreate} />;
      break;
    case "matches":
      page = <MyMatchesPage state={state} onToast={showToast} />;
      break;
    case "messages":
      page = <MessagesPage state={state} />;
      break;
    case "chat":
      page = activeConversation ? (
        <ChatPage
          state={state}
          conversation={activeConversation}
          onBack={() => dispatch({ type: "SET_MAIN_TAB", tab: "Messages" })}
        />
      ) : (
        <MessagesPage state={state} />
      );
      break;
    case "profile":
      page = <ProfilePage state={state} onToast={showToast} />;
      break;
    case "other-profile":
      page = (
        <ProfilePage
          state={state}
          isOther
          otherMatch={
            state.profileMatchId
              ? state.matches.find((match) => match.id === state.profileMatchId)
              : undefined
          }
          otherConversation={
            state.profileConversationId
              ? state.conversations.find(
                  (conversation) => conversation.id === state.profileConversationId,
                )
              : undefined
          }
          onToast={showToast}
        />
      );
      break;
    case "settings":
      page = (
        <SettingsPage
          state={state}
          onToast={showToast}
          onBack={() => dispatch({ type: "OPEN_PROFILE", target: "mine" })}
        />
      );
      break;
    case "faq":
      page = <FaqPage onBack={() => dispatch({ type: "NAVIGATE", screen: "settings" })} />;
      break;
    case "more":
      page = <MorePage onToast={showToast} />;
      break;
    case "create-match":
      page = <MatchCreation state={state} onBack={backToHome} />;
      break;
    case "match-success":
      page = selectedMatch ? (
        <MatchSuccess
          match={selectedMatch}
          updated={state.matchAction === "updated"}
          onToast={showToast}
        />
      ) : (
        <HomePage state={state} onToast={showToast} onCreate={openCreate} />
      );
      break;
    case "match-detail":
      page = selectedMatch ? (
        <MatchDetail match={selectedMatch} state={state} onBack={backToHome} onToast={showToast} />
      ) : (
        <HomePage state={state} onToast={showToast} onCreate={openCreate} />
      );
      break;
    default:
      page = <HomePage state={state} onToast={showToast} onCreate={openCreate} />;
  }

  return (
    <>
      <AppShell
        screen={state.screen}
        activeTab={state.mainTab}
        location={state.location}
        profile={state.profile}
        pendingRequestCount={pendingRequestCount}
        isOnline={online}
        onNavigate={(tab) => dispatch({ type: "SET_MAIN_TAB", tab })}
        onRequests={openRequests}
        onProfile={goProfile}
        onLocation={(city) => dispatch({ type: "SET_LOCATION", city })}
        onCreate={openCreate}
      >
        {page}
      </AppShell>
      <Toast message={toastMessage} onClose={closeToast} />
    </>
  );
}
