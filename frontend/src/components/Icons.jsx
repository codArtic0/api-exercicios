const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

export const Dumbbell = ({ size = 24, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
  </svg>
)

export const Barbell = ({ size = 24, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <path d="M2 12h20M5 7v10M8.5 9v6M15.5 9v6M19 7v10" />
  </svg>
)

export const Kettlebell = ({ size = 24, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <path d="M8.5 7.5C8.5 4 10 3 12 3s3.5 1 3.5 4.5" />
    <path d="M9 7.5h6a6 6 0 1 1-6 0Z" />
  </svg>
)

export const Plate = ({ size = 24, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
  </svg>
)

export const Bolt = ({ size = 24, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
)

export const Search = ({ size = 20, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const ChevronLeft = ({ size = 22, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const ChevronRight = ({ size = 20, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const Plus = ({ size = 22, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const Minus = ({ size = 22, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <path d="M5 12h14" />
  </svg>
)

export const Trophy = ({ size = 18, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
  </svg>
)

export const LogOut = ({ size = 20, ...props }) => (
  <svg {...base} width={size} height={size} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)
