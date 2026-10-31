// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MyMatchesPage } from "@/features/matches/components/MyMatchesPage";
import { AppStore, useAppStore } from "@/lib/app-store";

afterEach(cleanup);

function RequestFlowHarness() {
  const { state, dispatch } = useAppStore();

  return (
    <>
      <output data-testid="active-chat">{state.activeChatId}</output>
      <button
        type="button"
        onClick={() => dispatch({ type: "RESPOND_TO_REQUEST", id: "incoming-1", accept: false })}
      >
        Clear seeded request
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "REQUEST_TO_JOIN", id: "m-basketball-1", requestId: "ui-request" })
        }
      >
        Request to join
      </button>
      <button type="button" onClick={() => dispatch({ type: "SET_MATCH_TAB", tab: "Requests" })}>
        View requests
      </button>
      <MyMatchesPage state={state} onToast={() => undefined} />
    </>
  );
}

describe("MyMatchesPage request actions", () => {
  it("starts a new conversation from an incoming request", async () => {
    render(
      <AppStore>
        <RequestFlowHarness />
      </AppStore>,
    );

    fireEvent.click(screen.getByRole("button", { name: "View requests" }));
    fireEvent.click(screen.getByRole("button", { name: "Message Alex Morgan" }));

    expect((await screen.findByTestId("active-chat")).textContent).toBe("conversation-alexm");
  });

  it("shows and cancels a pending outgoing request", async () => {
    render(
      <AppStore>
        <RequestFlowHarness />
      </AppStore>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear seeded request" }));
    fireEvent.click(screen.getByRole("button", { name: "Request to join" }));
    fireEvent.click(screen.getByRole("button", { name: "View requests" }));

    expect(await screen.findByText(/Your request to join/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel request" }));

    expect(await screen.findByRole("heading", { name: "No open requests" })).toBeTruthy();
  });
});
