"use client";

import { useRef, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import type { AppState, ChatMessage, Conversation } from "@/lib/domain";
import { useAppStore } from "@/lib/app-store";

export function ChatPage({
  state,
  conversation,
  onBack,
}: {
  state: AppState;
  conversation: Conversation;
  onBack: () => void;
}) {
  const { dispatch } = useAppStore();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    const message: ChatMessage = {
      id: `message-${Date.now()}`,
      text: text.trim(),
      createdAt: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(
        new Date(),
      ),
      mine: true,
    };
    dispatch({ type: "SEND_MESSAGE", conversationId: conversation.id, message });
    setText("");
  }
  function attachFile() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const message: ChatMessage = {
      id: `file-${Date.now()}`,
      text: "Shared a file",
      attachment: file.name,
      createdAt: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(
        new Date(),
      ),
      mine: true,
    };
    dispatch({ type: "SEND_MESSAGE", conversationId: conversation.id, message });
    if (fileRef.current) fileRef.current.value = "";
  }
  const currentMessages =
    state.conversations.find((item) => item.id === conversation.id)?.messages ??
    conversation.messages;

  return (
    <section className="chat-page">
      <header className="chat-header">
        <button
          type="button"
          className="icon-button"
          aria-label="Back to messages"
          onClick={onBack}
        >
          <Icon name="arrowLeft" />
        </button>
        <Avatar name={conversation.name} src={conversation.avatar} />
        <span>
          <strong>{conversation.name}</strong>
          <small>{conversation.matchTitle}</small>
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="View profile"
          onClick={() =>
            dispatch({ type: "OPEN_PROFILE", target: "other", conversationId: conversation.id })
          }
        >
          <Icon name="more" />
        </button>
      </header>
      <div className="chat-match-context">
        <Icon name="trophy" size={15} />
        <span>
          Chat about <strong>{conversation.matchTitle}</strong>
        </span>
        <button
          type="button"
          onClick={() => {
            const match = state.matches.find((item) => item.title === conversation.matchTitle);
            if (match) dispatch({ type: "OPEN_MATCH", id: match.id });
          }}
        >
          View match
        </button>
      </div>
      <div className="chat-messages" aria-live="polite">
        {currentMessages.map((message) => (
          <div key={message.id} className={`message-line ${message.mine ? "mine" : "theirs"}`}>
            <div className="message-bubble">
              {message.attachment && (
                <span className="attachment-chip">
                  <Icon name="copy" size={14} />
                  {message.attachment}
                </span>
              )}
              <p>{message.text}</p>
              <div className="message-meta">
                <time>{message.createdAt}</time>
                {message.mine && (
                  <Icon name="checkDouble" size={15} className="message-read-icon" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {showEmoji && (
        <div className="emoji-tray" aria-label="Choose an emoji">
          {["⚽", "🏀", "🏸", "🎾", "🙌", "😊", "👍", "🔥"].map((emoji) => (
            <button
              type="button"
              key={emoji}
              aria-label={`Insert ${emoji}`}
              onClick={() => setText((value) => `${value}${emoji}`)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <form className="chat-composer" onSubmit={sendMessage}>
        <input ref={fileRef} type="file" className="sr-only" onChange={attachFile} />
        <button
          type="button"
          className="icon-button"
          aria-label="Attach a file"
          onClick={() => fileRef.current?.click()}
        >
          <Icon name="copy" size={20} />
        </button>
        <div className="composer-field">
          <button type="button" aria-label="Insert emoji" onClick={() => setShowEmoji(!showEmoji)}>
            ☺
          </button>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Message"
            aria-label="Message text"
            maxLength={500}
          />
          <button
            type="submit"
            className="send-message"
            aria-label="Send message"
            disabled={!text.trim()}
          >
            <Icon name="send" size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}
