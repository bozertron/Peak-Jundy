"use client";

import { forwardRef, createContext, useContext, HTMLAttributes, ReactNode } from "react";

// ============================================================================
// TYPES
// ============================================================================

export type PeakCardVariant =
  | "default"   // White-stone surface, soft Peak shadow
  | "equipment" // Brass left-stripe accent for marketplace items
  | "stats"     // Subtle forest gradient wash for metrics
  | "framed"    // Wood-tone border + frame shadow ("art on the wall")
  | "elevated"; // Synonym of framed; emphasizes lift over surface

export type PeakCardPadding = "none" | "sm" | "md" | "lg";

export interface PeakCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card style variant */
  variant?: PeakCardVariant;
  /** Internal padding around children */
  padding?: PeakCardPadding;
  /** Enable hover lift animation effect */
  hoverLift?: boolean;
  /** Show wood accent bar at top of card */
  woodAccent?: boolean;
  /** Additional CSS classes */
  className?: string;
  children?: ReactNode;
}

export interface PeakCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional title rendered in serif font */
  title?: string;
  /** Optional subtitle rendered in muted text */
  subtitle?: string;
  /** Optional action element (button, icon, etc.) */
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export interface PeakCardBodyProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: ReactNode;
}

export interface PeakCardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Remove default border-top styling */
  noBorder?: boolean;
  className?: string;
  children?: ReactNode;
}

// ============================================================================
// CONTEXT
// ============================================================================

interface PeakCardContextValue {
  variant: PeakCardVariant;
}

const PeakCardContext = createContext<PeakCardContextValue | null>(null);

function usePeakCardContext() {
  const context = useContext(PeakCardContext);
  if (!context) {
    throw new Error("PeakCard compound components must be used within a PeakCard");
  }
  return context;
}

// ============================================================================
// UTILITY
// ============================================================================

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// VARIANT STYLES
// ============================================================================

const variantStyles: Record<PeakCardVariant, string> = {
  default: cn(
    "bg-peak-snow",
    "border border-peak-stone",
    "shadow-peak"
  ),
  equipment: cn(
    "bg-peak-snow",
    "border border-peak-stone",
    "border-l-[3px] border-l-peak-brass",
    "shadow-peak-equipment"
  ),
  stats: cn(
    "bg-peak-snow",
    "border border-peak-stone",
    "shadow-peak-md",
    "bg-gradient-to-br from-peak-snow to-peak-forest/5"
  ),
  framed: cn(
    "bg-peak-snow",
    "border border-peak-wood/10",
    "shadow-peak-frame"
  ),
  // Same wood-frame styling as `framed`; alias for code that calls it `elevated`.
  elevated: cn(
    "bg-peak-snow",
    "border border-peak-wood/10",
    "shadow-peak-frame"
  ),
};

// ============================================================================
// COMPOUND COMPONENTS
// ============================================================================

/**
 * PeakCard.Header - Card header section
 */
const PeakCardHeader = forwardRef<HTMLDivElement, PeakCardHeaderProps>(
  ({ title, subtitle, action, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start justify-between gap-4",
          "pb-4",
          className
        )}
        {...props}
      >
        {children || (
          <>
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="font-serif text-lg font-semibold text-peak-charcoal leading-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-peak-slate line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </>
        )}
      </div>
    );
  }
);

PeakCardHeader.displayName = "PeakCard.Header";

/**
 * PeakCard.Body - Main content area
 */
const PeakCardBody = forwardRef<HTMLDivElement, PeakCardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-peak-charcoal", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PeakCardBody.displayName = "PeakCard.Body";

/**
 * PeakCard.Footer - Card footer section
 */
const PeakCardFooter = forwardRef<HTMLDivElement, PeakCardFooterProps>(
  ({ noBorder = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 pt-4 mt-4",
          !noBorder && "border-t border-peak-stone",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PeakCardFooter.displayName = "PeakCard.Footer";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * PeakCard - A sophisticated card component following the PEAK AESTHETIC design system.
 *
 * @example
 * ```tsx
 * <PeakCard variant="equipment" hoverLift>
 *   <PeakCard.Header>Ski Equipment</PeakCard.Header>
 *   <PeakCard.Body>Card content goes here...</PeakCard.Body>
 *   <PeakCard.Footer>Footer actions</PeakCard.Footer>
 * </PeakCard>
 * ```
 *
 * @example With wood accent
 * ```tsx
 * <PeakCard variant="framed" woodAccent>
 *   <PeakCard.Header title="Featured Item" subtitle="Premium selection" />
 *   <PeakCard.Body>...</PeakCard.Body>
 * </PeakCard>
 * ```
 */
const paddingStyles: Record<PeakCardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

const PeakCardRoot = forwardRef<HTMLDivElement, PeakCardProps>(
  (
    {
      variant = "default",
      padding = "md",
      hoverLift = false,
      woodAccent = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      "rounded-peak",
      "overflow-hidden",
      "transition-all duration-250 ease-out"
    );

    const hoverStyles = hoverLift
      ? "hover-lift hover:shadow-peak-lift hover:-translate-y-1 cursor-pointer"
      : "";

    return (
      <PeakCardContext.Provider value={{ variant }}>
        <div
          ref={ref}
          className={cn(
            baseStyles,
            variantStyles[variant],
            hoverStyles,
            className
          )}
          {...props}
        >
          {/* Optional wood accent bar */}
          {woodAccent && (
            <div className="peak-wood-accent w-full h-1" />
          )}

          {/* Card content with padding */}
          <div className={paddingStyles[padding]}>
            {children}
          </div>
        </div>
      </PeakCardContext.Provider>
    );
  }
);

PeakCardRoot.displayName = "PeakCard";

// ============================================================================
// COMPOUND COMPONENT ASSEMBLY
// ============================================================================

/**
 * PeakCard compound component with Header, Body, and Footer subcomponents.
 *
 * Variants:
 * - `default` - Standard card with snow background and stone border
 * - `equipment` - Card with brass left border accent for equipment items
 * - `stats` - Card with subtle forest gradient for statistics/metrics
 * - `framed` - "Curated object" look with frame shadow
 *
 * Features:
 * - `hoverLift` - Enables hover animation with lift effect
 * - `woodAccent` - Adds decorative wood gradient bar at top
 */
export const PeakCard = Object.assign(PeakCardRoot, {
  Header: PeakCardHeader,
  Body: PeakCardBody,
  Footer: PeakCardFooter,
});

// Export subcomponents individually for flexible imports
export { PeakCardHeader, PeakCardBody, PeakCardFooter };

export default PeakCard;
