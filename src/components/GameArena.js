import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroupState, rollDiceForGroup, leaveGroup, clearRollError } from '../features/groups/groupsSlice';
import Avatar from './Avatar';
import Dice from './Dice';
import QueueAvatars from './QueueAvatars';
import EventHistory from './EventHistory';
import './GameArena.css';

const POLL_INTERVAL_MS = 3000;
const MIN_ROLL_ANIMATION_MS = 700;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const namesMatch = (a, b) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

export default function GameArena() {
  const dispatch = useDispatch();
  const { current: group, rollError } = useSelector((state) => state.groups);
  const { user } = useSelector((state) => state.auth);
  const [isRolling, setIsRolling] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Other players act in their own browser tabs, so poll the server for the
  // latest queue, turn, dice and history.
  useEffect(() => {
    if (!group?.id) return undefined;
    const timer = setInterval(() => {
      dispatch(fetchGroupState({ groupId: group.id, silent: true }));
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [dispatch, group?.id]);

  if (!group) return null;

  const { id, name, activePlayers, waitingQueue, currentTurn, diceValues, gameHistory, status, winner } = group;

  // The server is the real gatekeeper (it returns 403 on someone else's
  // turn); this only decides whether the button is enabled.

  console.log('user?.displayName: status, currentTurn', user?.displayName, status, currentTurn);
  const isMyTurn = status === 'playing' && namesMatch(user?.displayName, currentTurn);

  const handleRoll = async () => {
    if (!isMyTurn || isRolling) return;
    setIsRolling(true);
    try {
      // The POST rolls the dice on the server, stores the Roll in the
      // database and returns the fresh group state, which lands in the store.
      // The minimum wait just keeps the tumble animation visible when the
      // API answers instantly.
      await Promise.all([dispatch(rollDiceForGroup(id)), wait(MIN_ROLL_ANIMATION_MS)]);
    } finally {
      setIsRolling(false);
    }
  };

  const handleLeave = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    // On success the group is cleared from the store and App shows the
    // dashboard again; on failure re-enable the button.
    const result = await dispatch(leaveGroup(id));
    if (leaveGroup.rejected.match(result)) setIsLeaving(false);
  };

  let hint;
  if (status === 'waiting') hint = 'Waiting for an opponent to join…';
  else if (isMyTurn) hint = 'Your turn — roll the dice!';
  else hint = `Waiting for ${currentTurn} to roll…`;

  return (
    <div className="arena-screen">
      <header className="arena-topbar">
        <button type="button" className="leave-btn" onClick={handleLeave} disabled={isLeaving}>
          <span aria-hidden="true">←</span> {isLeaving ? 'Leaving…' : 'Leave'}
        </button>
        <h1 className="arena-title">{name}</h1>
        <QueueAvatars queue={waitingQueue} />
      </header>

      <div className="arena-body">
        <section className="play-area" aria-label="Playing area">
          {status === 'finished' ? (
            <div className="finished-panel">
              <Avatar name={winner} size={88} />
              <h2>{winner} wins {name}!</h2>
              <p>Everyone else in the queue has been beaten.</p>
              <button type="button" className="roll-btn" onClick={handleLeave} disabled={isLeaving}>
                Back to dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="players-row">
                {[0, 1].map((slot) => {
                  const player = activePlayers[slot];
                  if (!player) {
                    return (
                      <div key={`empty-${slot}`} className="player-slot is-empty">
                        <span className="seat-placeholder">?</span>
                        <span className="player-name">Open seat</span>
                      </div>
                    );
                  }
                  const isTurn = player === currentTurn;
                  return (
                    <React.Fragment key={player}>
                      {slot === 1 && <span className="versus">vs</span>}
                      <div className={`player-slot ${isTurn ? 'is-turn' : ''}`}>
                        <Avatar name={player} size={64} />
                        <span className="player-name">
                          {player}
                          {namesMatch(user?.displayName, player) && <em className="you-tag"> (you)</em>}
                        </span>
                        {isTurn && <span className="turn-badge">Rolling now</span>}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="dice-row">
                <Dice value={diceValues?.[0]} rolling={isRolling} />
                <Dice value={diceValues?.[1]} rolling={isRolling} />
              </div>

              <p className={`turn-hint ${isMyTurn ? 'is-mine' : ''}`}>{hint}</p>

              <button type="button" className="roll-btn" onClick={handleRoll} disabled={!isMyTurn || isRolling}>
                {isRolling ? 'Rolling…' : 'Roll dice'}
              </button>

              {rollError && (
                <p className="roll-error" role="alert" onClick={() => dispatch(clearRollError())}>
                  {rollError}
                </p>
              )}
            </>
          )}
        </section>

        <aside className="arena-side">
          <EventHistory events={gameHistory} />
        </aside>
      </div>
    </div>
  );
}
