import type { AppState, JoinRequest } from "@/lib/domain";
import { isBlocked } from "@/lib/users";

type RequestState = Pick<AppState, "requests" | "matches" | "blockedUsers">;

export function selectVisiblePendingRequests(state: RequestState): JoinRequest[] {
  return state.requests.filter((request) => {
    if (request.status !== "pending" || isBlocked(state.blockedUsers, request.username))
      return false;
    const match = state.matches.find((item) => item.id === request.matchId);
    return Boolean(match && !isBlocked(state.blockedUsers, match.hostHandle));
  });
}
