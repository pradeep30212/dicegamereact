import React from 'react';

const STATUS_LABEL = {
  waiting: 'Waiting for players',
  playing: 'Match in progress',
  finished: 'Finished',
};

// One clickable dashboard tile. The whole tile is the button, so clicking
// anywhere on it joins the group.
export default function GroupTile({ group, disabled, onSelect }) {
  const { name, memberCount, maxMembers, status } = group;
  const isFull = memberCount >= maxMembers;
  const isFinished = status === 'finished';
  const unavailable = isFull || isFinished;

  let cta = 'Join table →';
  if (isFinished) cta = 'Finished';
  else if (isFull) cta = 'Full';

  return (
    <button
      type="button"
      className={`group-tile status-${status} ${unavailable ? 'is-unavailable' : ''}`}
      disabled={disabled || unavailable}
      onClick={() => onSelect(group.id)}
      aria-label={`${name}, ${memberCount} of ${maxMembers} players. ${cta}`}
    >
      <span className="tile-status">{STATUS_LABEL[status] || status}</span>
      <span className="tile-name">{name}</span>

      <span className="tile-seats" aria-hidden="true">
        {Array.from({ length: maxMembers }, (_, i) => (
          <span key={i} className={`seat ${i < memberCount ? 'taken' : ''}`} />
        ))}
      </span>

      <span className="tile-footer">
        <span className="tile-count">
          {memberCount}/{maxMembers} players
        </span>
        <span className="tile-cta">{cta}</span>
      </span>
    </button>
  );
}
