import React, { useEffect, useState } from 'react';

// Pip positions on a 3x3 grid (0 = top-left ... 8 = bottom-right).
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const randomFace = () => Math.floor(Math.random() * 6) + 1;

// `value` is always the number stored by the server. While `rolling` is true
// the die only *tumbles* through random faces as a visual — nothing here
// decides the result.
export default function Dice({ value, rolling }) {
  const [tumbleFace, setTumbleFace] = useState(randomFace);

  useEffect(() => {
    if (!rolling) return undefined;
    const timer = setInterval(() => setTumbleFace(randomFace()), 90);
    return () => clearInterval(timer);
  }, [rolling]);

  const face = rolling ? tumbleFace : value;
  const active = PIPS[face] || [];

  return (
    <div
      className={`die ${rolling ? 'is-rolling' : ''} ${face ? '' : 'is-blank'}`}
      role="img"
      aria-label={face ? `Die showing ${face}` : 'Die not rolled yet'}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`pip ${active.includes(i) ? 'on' : ''}`} />
      ))}
    </div>
  );
}
