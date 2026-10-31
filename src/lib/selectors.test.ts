import { describe, expect, it } from "vitest";
import { createInitialState } from "@/lib/seed-data";
import { selectVisiblePendingRequests } from "@/lib/selectors";

describe("visible pending request selector", () => {
  it("excludes requests for blocked users and missing matches", () => {
    const initial = createInitialState();
    const state = {
      ...initial,
      blockedUsers: ["@alexm"],
      requests: [
        ...initial.requests,
        { ...initial.requests[0], id: "orphan", matchId: "missing", username: "@newplayer" },
      ],
    };
    expect(selectVisiblePendingRequests(state)).toEqual([]);
  });
});
