import type { AppAction, AppState } from "@/lib/domain";
import { createInitialState } from "@/lib/seed-data";
import { isBlocked, normalizeUsername } from "@/lib/users";

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        ...(action.payload ?? {}),
        screen: action.payload?.hasStarted ? "home" : "onboarding",
      };
    case "NAVIGATE":
      return { ...state, screen: action.screen };
    case "SET_MAIN_TAB": {
      const screenByTab = {
        Home: "home",
        "My Matches": "matches",
        Messages: "messages",
        More: "more",
      } as const;
      return { ...state, mainTab: action.tab, screen: screenByTab[action.tab] };
    }
    case "SET_MATCH_TAB":
      return { ...state, matchesTab: action.tab };
    case "SET_LOCATION":
      return { ...state, location: action.city };
    case "SET_DETAIL_TAB":
      return { ...state, detailTab: action.tab };
    case "OPEN_MATCH": {
      const match = state.matches.find((item) => item.id === action.id);
      if (!match || isBlocked(state.blockedUsers, match.hostHandle)) return state;
      return { ...state, selectedMatchId: action.id, detailTab: "Venue", screen: "match-detail" };
    }
    case "OPEN_CHAT":
      if (
        !state.conversations.some(
          (conversation) =>
            conversation.id === action.id && !isBlocked(state.blockedUsers, conversation.username),
        )
      )
        return state;
      return {
        ...state,
        activeChatId: action.id,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.id ? { ...conversation, unread: false } : conversation,
        ),
        screen: "chat",
      };
    case "START_CONVERSATION": {
      if (isBlocked(state.blockedUsers, action.username)) return state;
      const existing = state.conversations.find(
        (item) => normalizeUsername(item.username) === normalizeUsername(action.username),
      );
      const conversation = existing
        ? { ...existing, unread: false }
        : {
            id: action.id,
            name: action.name,
            username: action.username,
            avatar: action.avatar,
            unread: false,
            matchTitle: action.matchTitle,
            messages: [],
          };
      return {
        ...state,
        conversations: existing
          ? state.conversations.map((item) => (item.id === existing.id ? conversation : item))
          : [conversation, ...state.conversations],
        activeChatId: conversation.id,
        screen: "chat",
      };
    }
    case "OPEN_PROFILE":
      return {
        ...state,
        profileTarget: action.target,
        profileMatchId: action.target === "other" ? (action.matchId ?? null) : null,
        profileConversationId: action.target === "other" ? (action.conversationId ?? null) : null,
        screen: action.target === "mine" ? "profile" : "other-profile",
      };
    case "STARTED":
      return { ...state, hasStarted: true, mainTab: "Home", screen: "home", authNotice: "" };
    case "SET_AUTH_NOTICE":
      return { ...state, authNotice: action.message };
    case "UPDATE_PROFILE":
      return {
        ...state,
        profile: action.profile,
        location: action.profile.city.trim() || state.location,
      };
    case "CREATE_MATCH":
      return {
        ...state,
        matches: [action.match, ...state.matches],
        hostedMatchIds: [action.match.id, ...state.hostedMatchIds],
        selectedMatchId: action.match.id,
        editingMatchId: null,
        matchAction: "created",
        screen: "match-success",
      };
    case "OPEN_MATCH_CREATION":
      return { ...state, editingMatchId: null, screen: "create-match" };
    case "EDIT_MATCH": {
      const match = state.matches.find((item) => item.id === action.id);
      if (!match || match.hostHandle !== state.profile.username) return state;
      return {
        ...state,
        selectedMatchId: match.id,
        editingMatchId: match.id,
        screen: "create-match",
      };
    }
    case "UPDATE_MATCH": {
      const previous = state.matches.find((item) => item.id === action.match.id);
      if (
        !previous ||
        previous.hostHandle !== state.profile.username ||
        action.match.capacity < previous.players
      )
        return state;
      return {
        ...state,
        matches: state.matches.map((item) =>
          item.id === action.match.id
            ? {
                ...action.match,
                players: previous.players,
                host: previous.host,
                hostHandle: previous.hostHandle,
                hostAvatar: previous.hostAvatar,
              }
            : item,
        ),
        editingMatchId: null,
        selectedMatchId: action.match.id,
        matchAction: "updated",
        screen: "match-success",
      };
    }
    case "CANCEL_MATCH": {
      const match = state.matches.find((item) => item.id === action.id);
      if (!match || match.hostHandle !== state.profile.username) return state;
      return {
        ...state,
        matches: state.matches.filter((item) => item.id !== action.id),
        requests: state.requests.filter((request) => request.matchId !== action.id),
        savedMatchIds: state.savedMatchIds.filter((id) => id !== action.id),
        hostedMatchIds: state.hostedMatchIds.filter((id) => id !== action.id),
        acceptedMatchIds: state.acceptedMatchIds.filter((id) => id !== action.id),
        playedMatchIds: state.playedMatchIds.filter((id) => id !== action.id),
        selectedMatchId: null,
        editingMatchId: null,
        matchAction: null,
        mainTab: "Home",
        screen: "home",
      };
    }
    case "TOGGLE_SAVED": {
      const exists = state.savedMatchIds.includes(action.id);
      return {
        ...state,
        savedMatchIds: exists
          ? state.savedMatchIds.filter((id) => id !== action.id)
          : [...state.savedMatchIds, action.id],
      };
    }
    case "REQUEST_TO_JOIN": {
      const match = state.matches.find((item) => item.id === action.id);
      if (
        !match ||
        match.access !== "Public" ||
        match.hostHandle === state.profile.username ||
        match.players >= match.capacity ||
        state.acceptedMatchIds.includes(action.id)
      )
        return state;
      if (
        state.requests.some(
          (request) =>
            request.matchId === action.id &&
            request.direction === "outgoing" &&
            request.status === "pending",
        )
      )
        return state;
      return {
        ...state,
        requests: [
          {
            id: action.requestId,
            matchId: action.id,
            direction: "outgoing",
            name: state.profile.name,
            username: state.profile.username,
            ageGroup: state.profile.ageGroup,
            skill: state.profile.skillBySport[match.sport] ?? "Intermediate",
            status: "pending",
          },
          ...state.requests,
        ],
      };
    }
    case "CANCEL_REQUEST": {
      const request = state.requests.find((item) => item.id === action.id);
      if (!request || request.direction !== "outgoing" || request.status !== "pending")
        return state;
      return {
        ...state,
        requests: state.requests.map((item) =>
          item.id === action.id ? { ...item, status: "cancelled" } : item,
        ),
      };
    }
    case "RESPOND_TO_REQUEST": {
      const request = state.requests.find((item) => item.id === action.id);
      const match = request && state.matches.find((item) => item.id === request.matchId);
      if (
        !request ||
        request.status !== "pending" ||
        request.direction !== "incoming" ||
        !match ||
        match.hostHandle !== state.profile.username ||
        isBlocked(state.blockedUsers, request.username) ||
        (action.accept && match.players >= match.capacity)
      )
        return state;
      return {
        ...state,
        requests: state.requests.map((item) =>
          item.id === action.id
            ? { ...item, status: action.accept ? "accepted" : "declined" }
            : item,
        ),
        matches: action.accept
          ? state.matches.map((item) =>
              item.id === request.matchId ? { ...item, players: item.players + 1 } : item,
            )
          : state.matches,
        acceptedMatchIds: state.acceptedMatchIds,
      };
    }
    case "LEAVE_MATCH":
      if (!state.acceptedMatchIds.includes(action.id)) return state;
      return {
        ...state,
        acceptedMatchIds: state.acceptedMatchIds.filter((id) => id !== action.id),
        requests: state.requests.map((request) =>
          request.matchId === action.id &&
          request.direction === "outgoing" &&
          request.status === "accepted"
            ? { ...request, status: "cancelled" }
            : request,
        ),
        matches: state.matches.map((match) =>
          match.id === action.id ? { ...match, players: Math.max(1, match.players - 1) } : match,
        ),
      };
    case "SEND_MESSAGE":
      if (
        state.conversations.some(
          (conversation) =>
            conversation.id === action.conversationId &&
            isBlocked(state.blockedUsers, conversation.username),
        )
      )
        return state;
      return {
        ...state,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.conversationId
            ? {
                ...conversation,
                unread: false,
                messages: [...conversation.messages, action.message],
              }
            : conversation,
        ),
      };
    case "UPDATE_PREFERENCE":
      return { ...state, preferences: { ...state.preferences, [action.key]: action.value } };
    case "BLOCK_USER": {
      if (normalizeUsername(action.username) === normalizeUsername(state.profile.username))
        return state;
      const blockingActiveConversation = state.conversations.some(
        (conversation) =>
          conversation.id === state.activeChatId &&
          normalizeUsername(conversation.username) === normalizeUsername(action.username),
      );
      const blockingSelectedMatch = state.matches.some(
        (match) =>
          match.id === state.selectedMatchId &&
          normalizeUsername(match.hostHandle) === normalizeUsername(action.username),
      );
      return {
        ...state,
        blockedUsers: isBlocked(state.blockedUsers, action.username)
          ? state.blockedUsers
          : [...state.blockedUsers, normalizeUsername(action.username)],
        requests: state.requests.map((request) => {
          const match = state.matches.find((item) => item.id === request.matchId);
          const blockedRequester =
            request.direction === "incoming" &&
            normalizeUsername(request.username) === normalizeUsername(action.username);
          const blockedHost =
            request.direction === "outgoing" &&
            match &&
            normalizeUsername(match.hostHandle) === normalizeUsername(action.username);
          return (blockedRequester || blockedHost) && request.status === "pending"
            ? { ...request, status: "cancelled" }
            : request;
        }),
        activeChatId: blockingActiveConversation ? null : state.activeChatId,
        selectedMatchId: blockingSelectedMatch ? null : state.selectedMatchId,
        mainTab: blockingSelectedMatch ? "Home" : state.mainTab,
        screen: blockingActiveConversation
          ? "messages"
          : blockingSelectedMatch
            ? "home"
            : state.screen,
      };
    }
    case "UNBLOCK_USER":
      return {
        ...state,
        blockedUsers: state.blockedUsers.filter((username) => username !== action.username),
      };
    case "RESET_TO_WELCOME":
      return { ...createInitialState(), screen: "onboarding" };
    case "SIGN_OUT":
      return { ...state, hasStarted: false, screen: "onboarding", mainTab: "Home" };
    default:
      return state;
  }
}
