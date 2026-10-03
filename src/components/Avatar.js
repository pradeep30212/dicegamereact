import React from 'react';

// Built-in avatars: no image assets or network calls. Colour, eyes and mouth
// are derived from a hash of the display name, so the same player looks the
// same in every browser tab.
const PALETTE = ['#e07a5f', '#3d9970', '#5b8def', '#b565a7', '#e0a030', '#2a9d8f', '#c9506b', '#7a6ff0'];
const INK = '#1c1b29';

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function Eyes({ variant }) {
  if (variant === 1) {
    return (
      <>
        <ellipse cx="14" cy="17" rx="2" ry="3" fill={INK} />
        <ellipse cx="26" cy="17" rx="2" ry="3" fill={INK} />
      </>
    );
  }
  if (variant === 2) {
    return (
      <>
        <path d="M11 18 Q14 13 17 18" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M23 18 Q26 13 29 18" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <circle cx="14" cy="17" r="2.3" fill={INK} />
      <circle cx="26" cy="17" r="2.3" fill={INK} />
    </>
  );
}

function Mouth({ variant }) {
  if (variant === 1) return <path d="M13 25 H27 A7 7 0 0 1 13 25 Z" fill={INK} />;
  if (variant === 2) return <path d="M15 28 H25" stroke={INK} strokeWidth="2" strokeLinecap="round" />;
  if (variant === 3) return <circle cx="20" cy="28" r="2.6" fill="none" stroke={INK} strokeWidth="2" />;
  return <path d="M13 26 Q20 33 27 26" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />;
}

/**
 * @param name      display name (drives the look)
 * @param size      pixel size
 * @param tooltip   show the name on hover/focus (touch: tap)
 * @param label     tooltip text override, defaults to name
 * @param highlight amber ring, used for "next up" in the queue
 */
export default function Avatar({ name, size = 40, tooltip = false, label, highlight = false }) {
  const safeName = name || '?';
  const h = hashString(safeName.trim().toLowerCase());
  const background = PALETTE[h % PALETTE.length];

  return (
    <span
      className={`avatar-wrap ${highlight ? 'is-next' : ''}`}
      style={{ width: size, height: size }}
      data-name={tooltip ? label || safeName : undefined}
      tabIndex={tooltip ? 0 : undefined}
    >
      <svg viewBox="0 0 40 40" role="img" aria-label={safeName}>
        <circle cx="20" cy="20" r="20" fill={background} />
        <Eyes variant={(h >> 3) % 3} />
        <Mouth variant={(h >> 5) % 4} />
      </svg>
    </span>
  );
}
