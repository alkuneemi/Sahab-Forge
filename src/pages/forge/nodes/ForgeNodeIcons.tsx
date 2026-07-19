interface ForgeNodeIconProps {
  kind: "start" | "model" | "view" | "action" | "state" | "externalApi" | "tool";
  variant?: string;
  size?: number;
  className?: string;
}

export function ForgeNodeIcon({ kind, variant, size = 16, className }: ForgeNodeIconProps) {
  const baseProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (kind) {
    case "start":
      return (
        <svg {...baseProps}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
          <circle cx="5" cy="12" r="2" />
        </svg>
      );
    case "model":
      return (
        <svg {...baseProps}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 4v16" />
        </svg>
      );
    case "view":
      if (variant === "form") {
        return (
          <svg {...baseProps}>
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M8 8h8" />
            <path d="M8 12h6" />
            <path d="M8 16h4" />
          </svg>
        );
      }
      if (variant === "kanban") {
        return (
          <svg {...baseProps}>
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M9 8h2" />
            <path d="M9 12h2" />
            <path d="M13 8h3" />
            <path d="M13 12h3" />
          </svg>
        );
      }
      if (variant === "calendar") {
        return (
          <svg {...baseProps}>
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M4 10h16" />
            <path d="M8 3v4" />
            <path d="M16 3v4" />
          </svg>
        );
      }
      if (variant === "graph") {
        return (
          <svg {...baseProps}>
            <path d="M5 18V10" />
            <path d="M12 18V6" />
            <path d="M19 18v-8" />
            <path d="M3 18h18" />
          </svg>
        );
      }
      return (
        <svg {...baseProps}>
          <path d="M4 6h16" />
          <path d="M4 12h10" />
          <path d="M4 18h6" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      );
    case "action":
      return (
        <svg {...baseProps}>
          <path d="M13 2 6 13h5l-1 9 7-11h-5l1-9Z" />
        </svg>
      );
    case "state":
      return (
        <svg {...baseProps}>
          <path d="M12 4v16" />
          <path d="M4 8l8-4 8 4" />
          <path d="M4 16l8 4 8-4" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "externalApi":
      return (
        <svg {...baseProps}>
          <path d="M12 3v6" />
          <path d="M12 15v6" />
          <path d="M3 12h6" />
          <path d="M15 12h6" />
          <path d="M7 7 5 5" />
          <path d="M17 17l-2-2" />
          <path d="M7 17l-2 2" />
          <path d="M17 7l-2 2" />
        </svg>
      );
    case "tool":
    default:
      return (
        <svg {...baseProps}>
          <path d="M9 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
          <path d="M19 3h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
          <path d="M9 13H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z" />
          <path d="M19 13h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z" />
        </svg>
      );
  }
}
