"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";

/**
 * PEAK AESTHETIC Button Component
 *
 * A sophisticated button component following the PEAK design system.
 * "Confident restraint" - premium feel with subtle, purposeful interactions.
 *
 * @example
 * <PeakButton variant="primary" size="lg">Browse Equipment</PeakButton>
 * <PeakButton variant="accent" leftIcon={<StarIcon />}>Earn Peaks</PeakButton>
 */

// ============================================================================
// Types
// ============================================================================

export type PeakButtonVariant =
  | "primary"    // Forest green - main CTA
  | "secondary"  // Burgundy - secondary action
  | "accent"     // Brass - special highlight
  | "outline"    // Forest border, transparent bg
  | "ghost";     // Minimal, text-only appearance

export type PeakButtonSize = "sm" | "md" | "lg" | "xl";

export interface PeakButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant - determines color scheme */
  variant?: PeakButtonVariant;
  /** Button size */
  size?: PeakButtonSize;
  /** Show loading spinner and disable interactions */
  isLoading?: boolean;
  /** Icon to display on the left side */
  leftIcon?: ReactNode;
  /** Icon to display on the right side */
  rightIcon?: ReactNode;
  /** Make button full width of container */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Utility: Class name merger (simple implementation)
// ============================================================================

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// Loading Spinner Component
// ============================================================================

function LoadingSpinner({ size }: { size: PeakButtonSize }) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  return (
    <svg
      className={cn(sizeClasses[size], "animate-spin")}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================================================
// Style Configurations
// ============================================================================

const variantStyles: Record<PeakButtonVariant, string> = {
  // Primary: Forest green - Trust & Foundation
  primary: cn(
    "bg-peak-forest-500 text-white",
    "hover:bg-peak-forest-600",
    "active:bg-peak-forest-700",
    "focus:ring-peak-forest-500/50",
    "shadow-peak-sm hover:shadow-peak"
  ),

  // Secondary: Burgundy - Sophistication
  secondary: cn(
    "bg-peak-burgundy-500 text-white",
    "hover:bg-peak-burgundy-600",
    "active:bg-peak-burgundy-700",
    "focus:ring-peak-burgundy-500/50",
    "shadow-peak-sm hover:shadow-peak"
  ),

  // Accent: Brass - Action & Warmth
  accent: cn(
    "bg-peak-brass-500 text-white",
    "hover:bg-peak-brass-600",
    "active:bg-peak-brass-700",
    "focus:ring-peak-brass-500/50",
    "shadow-peak-sm hover:shadow-peak"
  ),

  // Outline: Forest border with transparent background
  outline: cn(
    "bg-transparent text-peak-forest-600",
    "border-2 border-peak-forest-500/40",
    "hover:bg-peak-forest-50 hover:border-peak-forest-500/60",
    "active:bg-peak-forest-100",
    "focus:ring-peak-forest-500/30"
  ),

  // Ghost: Minimal, text-only appearance
  ghost: cn(
    "bg-transparent text-peak-charcoal",
    "hover:bg-peak-stone/50",
    "active:bg-peak-stone",
    "focus:ring-peak-charcoal/20"
  ),
};

const sizeStyles: Record<PeakButtonSize, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-base px-6 py-3 gap-2.5",
  xl: "text-lg px-8 py-4 gap-3",
};

const iconSizeStyles: Record<PeakButtonSize, string> = {
  sm: "[&>svg]:w-3.5 [&>svg]:h-3.5",
  md: "[&>svg]:w-4 [&>svg]:h-4",
  lg: "[&>svg]:w-5 [&>svg]:h-5",
  xl: "[&>svg]:w-6 [&>svg]:h-6",
};

// ============================================================================
// PeakButton Component
// ============================================================================

export const PeakButton = forwardRef<HTMLButtonElement, PeakButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Base styles following PEAK AESTHETIC principles
    const baseStyles = cn(
      // Layout
      "inline-flex items-center justify-center",
      // Typography - Inter (sans) for buttons
      "font-sans font-medium",
      // Border radius - PEAK signature 10px rounded
      "rounded-peak",
      // Transitions - smooth, premium feel (250ms)
      "transition-all duration-250 ease-out",
      // Focus states - accessible ring
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-peak-cream",
      // Disabled states
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
      "disabled:hover:transform-none"
    );

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          iconSizeStyles[size],
          fullWidth && "w-full",
          !isDisabled && "hover:-translate-y-0.5",
          className
        )}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...props}
      >
        {/* Left icon or loading spinner */}
        {isLoading ? (
          <LoadingSpinner size={size} />
        ) : leftIcon ? (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}

        {/* Button text content */}
        <span className={cn(isLoading && "opacity-70")}>
          {children}
        </span>

        {/* Right icon (hidden during loading) */}
        {rightIcon && !isLoading && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

PeakButton.displayName = "PeakButton";

// ============================================================================
// Compound Components for Common Patterns
// ============================================================================

export interface PeakIconButtonProps extends Omit<PeakButtonProps, "children" | "leftIcon" | "rightIcon"> {
  /** Icon to display */
  icon: ReactNode;
  /** Accessible label for screen readers */
  "aria-label": string;
}

/**
 * Icon-only button variant
 * @example
 * <PeakIconButton icon={<SearchIcon />} aria-label="Search" />
 */
export const PeakIconButton = forwardRef<HTMLButtonElement, PeakIconButtonProps>(
  ({ icon, size = "md", className, ...props }, ref) => {
    const iconOnlySizes: Record<PeakButtonSize, string> = {
      sm: "p-1.5",
      md: "p-2",
      lg: "p-2.5",
      xl: "p-3",
    };

    return (
      <PeakButton
        ref={ref}
        size={size}
        className={cn(iconOnlySizes[size], "!px-0", className)}
        {...props}
      >
        <span className="inline-flex shrink-0" aria-hidden="true">
          {icon}
        </span>
      </PeakButton>
    );
  }
);

PeakIconButton.displayName = "PeakIconButton";

// ============================================================================
// Default Export
// ============================================================================

export default PeakButton;
