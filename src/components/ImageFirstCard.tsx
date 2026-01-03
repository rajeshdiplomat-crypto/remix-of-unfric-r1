import React from "react";

interface ImageFirstCardProps {
  /** Background image URL for the hero section */
  coverImage?: string;
  /** Main title displayed over the hero */
  title: string;
  /** Subtitle displayed below the title */
  subtitle?: string;
  /** Meta information (string or array of strings) */
  meta?: string | string[];
  /** Action buttons to display in the meta bar */
  actions?: React.ReactNode;
  /** Card body content */
  children?: React.ReactNode;
  /** Optional click handler for the card */
  onClick?: () => void;
  /** Accessible label for the article */
  ariaLabel?: string;
}

/**
 * ImageFirstCard - Zara-style editorial card with hero image
 * Presentational only - does not modify any data or handlers
 */
export function ImageFirstCard({
  coverImage,
  title,
  subtitle,
  meta,
  actions,
  children,
  onClick,
  ariaLabel,
}: ImageFirstCardProps) {
  const bgStyle: React.CSSProperties = coverImage
    ? { backgroundImage: `url(${coverImage})` }
    : {
        background: `linear-gradient(180deg, hsl(var(--muted) / 0.1), hsl(var(--card)))`,
      };

  return (
    <article
      className="editorial-card cursor-pointer transition-all duration-200 hover:shadow-lg"
      aria-label={ariaLabel || title}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Hero Image Band */}
      <div className="image-hero" style={bgStyle}>
        <div className="hero-caption">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {/* Meta Row */}
      <div className="editorial-meta">
        <div className="flex items-center gap-2 flex-wrap">
          {Array.isArray(meta) ? (
            meta.map((m, i) => (
              <span
                key={i}
                className="text-xs bg-muted/50 px-2 py-0.5 rounded-full"
              >
                {m}
              </span>
            ))
          ) : meta ? (
            <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-full">
              {meta}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      </div>

      {/* Body Content */}
      {children && <div className="editorial-body">{children}</div>}
    </article>
  );
}

export default ImageFirstCard;
