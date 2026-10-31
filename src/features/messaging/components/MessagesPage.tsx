"use client";

import "@/features/messaging/messaging.css";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import type { AppState } from "@/lib/domain";
import { useAppStore } from "@/lib/app-store";
import { isBlocked } from "@/lib/users";

export function MessagesPage({ state }: { state: AppState }) {
  const { dispatch } = useAppStore();
  const [query, setQuery] = useState("");
  const conversations = useMemo(
    () =>
      state.conversations.filter(
        (conversation) =>
          !isBlocked(state.blockedUsers, conversation.username) &&
          `${conversation.name} ${conversation.matchTitle} ${conversation.messages.at(-1)?.text ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [state.conversations, state.blockedUsers, query],
  );
  return (
    <section className="messages-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">KEEP IN TOUCH</p>
          <h1>Messages</h1>
          <p>Make a plan before the first whistle.</p>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Open match requests"
          onClick={() => {
            dispatch({ type: "SET_MATCH_TAB", tab: "Requests" });
            dispatch({ type: "SET_MAIN_TAB", tab: "My Matches" });
          }}
        >
          <Icon name="bell" />
        </button>
      </div>
      <label className="search-input message-search">
        <Icon name="search" size={18} />
        <input
          type="search"
          placeholder="Search conversations"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="sr-only">Search conversations</span>
      </label>
      {conversations.length ? (
        <div className="conversation-list">
          {conversations.map((conversation) => {
            const latest = conversation.messages.at(-1);
            return (
              <button
                type="button"
                className="conversation-row"
                key={conversation.id}
                onClick={() => dispatch({ type: "OPEN_CHAT", id: conversation.id })}
              >
                <Avatar name={conversation.name} src={conversation.avatar} size="lg" />
                <span className="conversation-main">
                  <span className="conversation-name">
                    <strong>{conversation.name}</strong>
                    <time>{latest?.createdAt ?? "Now"}</time>
                  </span>
                  <span className="conversation-preview">
                    {latest?.mine && <span>You: </span>}
                    {latest?.text ?? "Start the conversation"}
                  </span>
                  <span className="conversation-match">
                    <Icon name="trophy" size={13} />
                    {conversation.matchTitle}
                  </span>
                </span>
                {conversation.unread && (
                  <span className="unread-indicator" aria-label="Unread messages" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-emoji">💬</div>
          <h2>No conversations found</h2>
          <p>Try a different search or message a match host.</p>
          <button type="button" className="text-link" onClick={() => setQuery("")}>
            Clear search
          </button>
        </div>
      )}
      <p className="local-data-note">
        <Icon name="check" size={15} /> Conversations are stored on this device. Sending messages is
        a local demo interaction.
      </p>
    </section>
  );
}
