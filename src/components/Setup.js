import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setGroupName, addPlayer, removePlayer, startGame } from '../features/game/gameSlice';
import './Setup.css';

export default function Setup() {
  const dispatch = useDispatch();
  const { groupName, players } = useSelector((state) => state.game);
  const [playerName, setPlayerName] = useState('');

  const canAddPlayer = players.length < 5 && playerName.trim().length > 0;
  const canStart = groupName.trim().length > 0 && players.length >= 2 && players.length <= 5;

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!canAddPlayer) return;
    dispatch(addPlayer(playerName));
    setPlayerName('');
  };

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1>Set up your group</h1>

        <label htmlFor="groupName">Group name</label>
        <input
          id="groupName"
          value={groupName}
          onChange={(e) => dispatch(setGroupName(e.target.value))}
          placeholder="e.g. Group Galaxy"
        />

        <form onSubmit={handleAddPlayer} className="add-player-row">
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player name"
            disabled={players.length >= 5}
          />
          <button type="submit" disabled={!canAddPlayer}>
            Add player
          </button>
        </form>

        <ul className="player-list">
          {players.map((p, i) => (
            <li key={p}>
              <span className="player-index">{i + 1}</span>
              {p}
              <button
                type="button"
                className="remove-btn"
                onClick={() => dispatch(removePlayer(p))}
                aria-label={`Remove ${p}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <p className="player-count-hint">
          {players.length}/5 players added — need at least 2 to start.
        </p>

        <button
          type="button"
          className="start-btn"
          disabled={!canStart}
          onClick={() => dispatch(startGame())}
        >
          Start game
        </button>
      </div>
    </div>
  );
}
