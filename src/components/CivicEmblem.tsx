export function CivicEmblem({ className = 'w-11 h-11' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Civic Data Intelligence Emblem"
    >
      <circle cx="32" cy="32" r="30" fill="#1E3A8A" stroke="#F59E0B" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="24" fill="#172554" stroke="#93C5FD" strokeWidth="1" strokeDasharray="3 2" />
      <path
        d="M32 14C32 14 21 26.5 21 34.5C21 40.575 25.925 45.5 32 45.5C38.075 45.5 43 40.575 43 34.5C43 26.5 32 14 32 14Z"
        fill="#38BDF8"
        fillOpacity="0.25"
        stroke="#BAE6FD"
        strokeWidth="1.75"
      />
      <rect x="25" y="32" width="3.5" height="9" rx="1" fill="#F59E0B" />
      <rect x="30.25" y="27" width="3.5" height="14" rx="1" fill="#22C55E" />
      <rect x="35.5" y="30" width="3.5" height="11" rx="1" fill="#60A5FA" />
      <path d="M18 49H46" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
