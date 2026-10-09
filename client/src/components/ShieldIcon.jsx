/**
 * SVG shield icon used in the navbar and branding.
 * Inline SVG keeps the bundle dependency-free.
 */
export default function ShieldIcon({ size = 24, color = '#3b82f6' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"
        fill={color}
        opacity="0.85"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
