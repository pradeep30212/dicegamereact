import React from 'react';

const VISIBLE_EVENTS = 5;

// Shows only the latest 5 log lines from the server's gameHistory, newest first.
export default function EventHistory({ events }) {
  const recent = events.slice(-VISIBLE_EVENTS).reverse();

  return (
    <section className="event-panel" aria-label="Recent events">
      <h2>Recent events</h2>
      {recent.length === 0 ? (
        <p className="empty-hint">Nothing has happened yet.</p>
      ) : (
        <ol className="event-list">
          {recent.map((message, i) => (
            // Events are append-only, so an event's position in the full list
            // is a stable key.
            <li key={events.length - 1 - i} className={i === 0 ? 'is-latest' : ''}>
              {message}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
