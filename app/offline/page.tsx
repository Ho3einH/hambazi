import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <div className="offline-brand">
        <span>h</span> hambazi<span>.</span>
      </div>
      <div className="offline-symbol" aria-hidden="true">
        ⚽
      </div>
      <p className="eyebrow">NO SIGNAL, NO PROBLEM</p>
      <h1>You’re between games.</h1>
      <p>
        Your connection is offline right now. Your saved match list stays on this device; reconnect
        to discover new games and send requests.
      </p>
      <Link href="/">Try again</Link>
    </main>
  );
}
