import React, { useEffect, useRef, useState } from 'react';
import './Dice.css';

// Pip positions on a 3x3 grid (0 = top-left ... 8 = bottom-right) — one
// fixed layout per physical face of the cube. These never change; what
// changes is which face the cube has rotated to show the viewer.
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// The cube's own rotation (in degrees) that brings each face to point at the
// viewer. Faces are fixed opposite pairs summing to 7 (1-6, 2-5, 3-4), same
// as a real die — see the data-face transforms in Dice.css for how each
// face is physically placed on the cube.
const FACE_ROTATION = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
};

const TUMBLE_INTERVAL_MS = 100;

// How far the die is allowed to wander across its .dice-table while rolling,
// as a percentage of the table's width/height. Kept well inside 0-100 so the
// die never clips the table's edge even with its own width added on top.
const WANDER_X = [15, 85];
const WANDER_Y = [20, 80];

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const randomWithin = ([min, max]) => min + Math.random() * (max - min);

// Keeps the rotation spinning forward each tick rather than jittering in
// place — reads as tumbling in one general direction, like a thrown die.
function nextTumbleStep(prev) {
  return {
    rotX: prev.rotX + 70 + Math.random() * 80,
    rotY: prev.rotY + 70 + Math.random() * 80,
    left: randomWithin(WANDER_X),
    top: randomWithin(WANDER_Y),
  };
}

/**
 * A 3D cube rendered with CSS transforms (perspective + rotateX/rotateY),
 * positioned absolutely within a `.dice-table` so it can wander around that
 * area while rolling. `value` is always the number the server returned for
 * this roll — nothing here decides the result, only how it's displayed.
 *
 * `homeX`: resting horizontal position as a % of the table's width, so two
 * dice in the same table rest apart instead of stacking in the middle.
 */
export default function Dice({ value, rolling, homeX = 50 }) {
  const home = { rotX: 0, rotY: 0, left: homeX, top: 50 };
  const [state, setState] = useState(home);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Visual tumble only — position and rotation both wander on a timer. This
  // is purely cosmetic; it has no bearing on the actual result.
  useEffect(() => {
    if (!rolling || prefersReducedMotion) return undefined;
    const timer = setInterval(() => setState((prev) => nextTumbleStep(prev)), TUMBLE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [rolling]);

  // Once a result is known, rotate to land on that face and glide back to
  // this die's home spot. Landing adds one extra full turn on top of the
  // nearest equivalent angle, so it reads as spinning down rather than
  // snapping — but always ends up exactly on the server's value.
  useEffect(() => {
    if (rolling) return;

    if (value == null) {
      setState(home);
      return;
    }

    const target = FACE_ROTATION[value] || FACE_ROTATION[1];
    const current = stateRef.current;
    const extraSpin = prefersReducedMotion ? 0 : 360;

    setState({
      rotX: target.x + Math.round((current.rotX - target.x) / 360) * 360 + extraSpin,
      rotY: target.y + Math.round((current.rotY - target.y) / 360) * 360 + extraSpin,
      left: homeX,
      top: 50,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolling, value, homeX]);

  const transitionDuration = prefersReducedMotion ? '0s' : rolling ? '0.1s' : '0.6s';
  const transitionTimingFunction = rolling ? 'linear' : 'cubic-bezier(0.22, 0.9, 0.4, 1)';

  return (
    <div
      className="dice-scene"
      role="img"
      aria-label={value ? `Die showing ${value}` : 'Die not rolled yet'}
      style={{
        left: `${state.left}%`,
        top: `${state.top}%`,
        transitionDuration,
        transitionTimingFunction,
      }}
    >
      <div
        className="dice-cube"
        style={{
          transform: `rotateX(${state.rotX}deg) rotateY(${state.rotY}deg)`,
          transitionDuration,
          transitionTimingFunction,
        }}
      >
        {Object.entries(PIPS).map(([face, activePips]) => (
          <div key={face} className="dice-face" data-face={face}>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={`pip ${activePips.includes(i) ? 'on' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}