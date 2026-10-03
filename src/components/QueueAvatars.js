import React from 'react';
import Avatar from './Avatar';

// Top-right waiting queue. Front of the queue is first; hovering (or tapping)
// an avatar shows that player's display name.
export default function QueueAvatars({ queue }) {
  return (
    <div className="queue-bar" aria-label="Waiting queue">
      <span className="queue-label">Queue</span>
      {queue.length === 0 ? (
        <span className="queue-empty">empty</span>
      ) : (
        <div className="queue-avatars">
          {queue.map((name, index) => (
            <Avatar
              key={name}
              name={name}
              size={38}
              tooltip
              highlight={index === 0}
              label={index === 0 ? `${name} · next up` : name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
