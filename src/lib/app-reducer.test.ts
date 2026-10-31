import { describe, expect, it } from "vitest";
import { appReducer } from "@/lib/app-reducer";
import { createInitialState } from "@/lib/seed-data";
import { matchDraftSchema, persistedAppDataSchema } from "@/lib/validation";

describe("join request lifecycle", () => {
  it("lets a player withdraw a pending request and send a fresh one later", () => {
    const initial = createInitialState();
    const pending = appReducer(initial, {
      type: "REQUEST_TO_JOIN",
      id: "m-basketball-1",
      requestId: "outgoing-1",
    });

    expect(pending.requests[0]).toMatchObject({
      id: "outgoing-1",
      status: "pending",
      direction: "outgoing",
    });
    expect(pending.matches.find((match) => match.id === "m-basketball-1")?.players).toBe(5);

    const cancelled = appReducer(pending, { type: "CANCEL_REQUEST", id: "outgoing-1" });
    expect(cancelled.requests[0]?.status).toBe("cancelled");

    const retried = appReducer(cancelled, {
      type: "REQUEST_TO_JOIN",
      id: "m-basketball-1",
      requestId: "outgoing-2",
    });
    expect(retried.requests[0]).toMatchObject({ id: "outgoing-2", status: "pending" });
    expect(retried.requests[1]?.status).toBe("cancelled");
    expect(initial.requests).toHaveLength(1);
  });

  it("does not create duplicate requests or allow requests to full, private, or self-hosted games", () => {
    const initial = createInitialState();
    const pending = appReducer(initial, {
      type: "REQUEST_TO_JOIN",
      id: "m-basketball-1",
      requestId: "outgoing-1",
    });
    expect(
      appReducer(pending, {
        type: "REQUEST_TO_JOIN",
        id: "m-basketball-1",
        requestId: "outgoing-2",
      }),
    ).toBe(pending);

    const full = {
      ...initial,
      matches: initial.matches.map((match) =>
        match.id === "m-basketball-1" ? { ...match, players: match.capacity } : match,
      ),
    };
    expect(
      appReducer(full, { type: "REQUEST_TO_JOIN", id: "m-basketball-1", requestId: "full" }),
    ).toBe(full);
    expect(
      appReducer(initial, { type: "REQUEST_TO_JOIN", id: "m-football-1", requestId: "self" }),
    ).toBe(initial);

    const privateState = {
      ...initial,
      matches: initial.matches.map((match) =>
        match.id === "m-basketball-1" ? { ...match, access: "Private" as const } : match,
      ),
    };
    expect(
      appReducer(privateState, {
        type: "REQUEST_TO_JOIN",
        id: "m-basketball-1",
        requestId: "private",
      }),
    ).toBe(privateState);
  });

  it("accepts an incoming request once and prevents accepting into a full match", () => {
    const initial = createInitialState();
    const accepted = appReducer(initial, {
      type: "RESPOND_TO_REQUEST",
      id: "incoming-1",
      accept: true,
    });
    expect(accepted.requests[0]?.status).toBe("accepted");
    expect(accepted.matches.find((match) => match.id === "m-football-1")?.players).toBe(9);
    expect(
      appReducer(accepted, { type: "RESPOND_TO_REQUEST", id: "incoming-1", accept: true }),
    ).toBe(accepted);

    const full = {
      ...initial,
      matches: initial.matches.map((match) =>
        match.id === "m-football-1" ? { ...match, players: match.capacity } : match,
      ),
    };
    expect(appReducer(full, { type: "RESPOND_TO_REQUEST", id: "incoming-1", accept: true })).toBe(
      full,
    );
  });

  it("does not change attendance when a player declines an incoming request", () => {
    const initial = createInitialState();
    const declined = appReducer(initial, {
      type: "RESPOND_TO_REQUEST",
      id: "incoming-1",
      accept: false,
    });
    expect(declined.requests[0]?.status).toBe("declined");
    expect(declined.matches.find((match) => match.id === "m-football-1")?.players).toBe(8);
  });

  it("only decrements attendance when an accepted participant leaves", () => {
    const initial = createInitialState();
    const left = appReducer(initial, { type: "LEAVE_MATCH", id: "m-badminton-1" });
    expect(left.acceptedMatchIds).not.toContain("m-badminton-1");
    expect(left.matches.find((match) => match.id === "m-badminton-1")?.players).toBe(2);
    expect(appReducer(left, { type: "LEAVE_MATCH", id: "m-badminton-1" })).toBe(left);
  });

  it("creates a conversation for a new request sender and blocks further interaction after blocking", () => {
    const initial = createInitialState();
    const chatting = appReducer(initial, {
      type: "START_CONVERSATION",
      id: "conversation-alexm",
      name: "Alex Morgan",
      username: "@alexm",
      matchTitle: "Sunday kickabout — all welcome",
    });
    expect(chatting.screen).toBe("chat");
    expect(chatting.conversations[0]).toMatchObject({
      username: "@alexm",
      matchTitle: "Sunday kickabout — all welcome",
      messages: [],
    });

    const blocked = appReducer(chatting, { type: "BLOCK_USER", username: "@ALEXM" });
    expect(blocked.blockedUsers).toContain("@alexm");
    expect(blocked.screen).toBe("messages");
    expect(blocked.activeChatId).toBeNull();
    expect(blocked.requests.find((request) => request.username === "@alexm")?.status).toBe(
      "cancelled",
    );
    expect(appReducer(blocked, { type: "OPEN_CHAT", id: "conversation-alexm" })).toBe(blocked);
  });

  it("only allows the host to accept an incoming request", () => {
    const initial = createInitialState();
    const notHost = { ...initial, profile: { ...initial.profile, username: "@other" } };
    expect(
      appReducer(notHost, { type: "RESPOND_TO_REQUEST", id: "incoming-1", accept: true }),
    ).toBe(notHost);
  });

  it("removes a blocked host’s match from discovery and closes its detail screen", () => {
    const initial = appReducer(createInitialState(), { type: "OPEN_MATCH", id: "m-badminton-1" });
    const blocked = appReducer(initial, { type: "BLOCK_USER", username: "@mayak" });
    expect(blocked.screen).toBe("home");
    expect(blocked.selectedMatchId).toBeNull();
    expect(appReducer(blocked, { type: "OPEN_MATCH", id: "m-badminton-1" })).toBe(blocked);
  });

  it("allows only the host to edit a match and preserves joined player counts", () => {
    const initial = createInitialState();
    const editing = appReducer(initial, { type: "EDIT_MATCH", id: "m-football-1" });
    expect(editing.screen).toBe("create-match");
    expect(editing.editingMatchId).toBe("m-football-1");

    const original = editing.matches.find((match) => match.id === "m-football-1");
    if (!original) throw new Error("Expected the seeded football match.");
    const updated = appReducer(editing, {
      type: "UPDATE_MATCH",
      match: { ...original, title: "Updated kickabout", capacity: 12 },
    });
    expect(updated.screen).toBe("match-success");
    expect(updated.matchAction).toBe("updated");
    expect(updated.matches.find((match) => match.id === original.id)).toMatchObject({
      title: "Updated kickabout",
      capacity: 12,
      players: 8,
    });

    const impossibleCapacity = appReducer(editing, {
      type: "UPDATE_MATCH",
      match: { ...original, capacity: 7 },
    });
    expect(impossibleCapacity).toBe(editing);
    const notTheHost = { ...initial, profile: { ...initial.profile, username: "@someoneelse" } };
    expect(appReducer(notTheHost, { type: "EDIT_MATCH", id: "m-football-1" })).toBe(notTheHost);
  });

  it("lets only the host cancel a match and cleans up its local references", () => {
    const initial = createInitialState();
    const cancelled = appReducer(initial, { type: "CANCEL_MATCH", id: "m-football-1" });
    expect(cancelled.matches.some((match) => match.id === "m-football-1")).toBe(false);
    expect(cancelled.hostedMatchIds).not.toContain("m-football-1");
    expect(cancelled.savedMatchIds).not.toContain("m-football-1");
    expect(cancelled.requests.some((request) => request.matchId === "m-football-1")).toBe(false);
    expect(cancelled.screen).toBe("home");

    const notHost = { ...initial, profile: { ...initial.profile, username: "@someoneelse" } };
    expect(appReducer(notHost, { type: "CANCEL_MATCH", id: "m-football-1" })).toBe(notHost);
  });

  it("keeps the discovery city in sync when the profile city changes", () => {
    const initial = createInitialState();
    const updated = appReducer(initial, {
      type: "UPDATE_PROFILE",
      profile: { ...initial.profile, city: "Bristol" },
    });
    expect(updated.location).toBe("Bristol");
  });
});

describe("runtime validation", () => {
  it("accepts the seeded browser data and rejects malformed persisted values", () => {
    const initial = createInitialState();
    expect(persistedAppDataSchema.safeParse(initial).success).toBe(true);
    expect(persistedAppDataSchema.safeParse({ matches: "broken", profile: null }).success).toBe(
      false,
    );
  });

  it("rejects match drafts without a future date, venue, skill, or valid fee", () => {
    const draft = {
      sport: "Football",
      format: "Players",
      title: "Sunday football",
      capacity: 10,
      duration: 90,
      fee: 5,
      venue: "Sports Centre",
      address: "Oxford Road, London",
      city: "London",
      date: "2099-11-01",
      time: "10:30",
      skillLevels: ["Beginner"],
      ageGroups: ["18–30"],
      access: "Public",
      description: "Friendly match",
    };
    expect(matchDraftSchema.safeParse(draft).success).toBe(true);
    expect(matchDraftSchema.safeParse({ ...draft, fee: -1 }).success).toBe(false);
    expect(matchDraftSchema.safeParse({ ...draft, venue: "", skillLevels: [] }).success).toBe(
      false,
    );
  });
});
