// Outline icons for the homepage, drawn on a 24 px grid with a 1.5 px stroke.
const PATHS = {
  person: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="m16 11 2 2 4-4.5" />
    </>
  ),
  layers: (
    <>
      <rect x="3" y="3" width="12" height="12" rx="2.5" />
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  message: <path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-4.5 4v-4H7a3 3 0 0 1-3-3Z" />,
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.8 2.5 4 5.7 4 9s-1.2 6.5-4 9c-2.8-2.5-4-5.7-4-9s1.2-6.5 4-9Z" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="hm-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
