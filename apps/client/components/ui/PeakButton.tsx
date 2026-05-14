import { forwardRef, ButtonHTMLAttributes } from "react";

export type PeakButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type PeakButtonSize = "sm" | "md" | "lg";

interface PeakButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PeakButtonVariant;
  size?: PeakButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<PeakButtonVariant, string> = {
  primary: "bg-peak-forest text-white hover:bg-peak-forest/90 active:bg-peak-forest/80",
  secondary: "bg-peak-cream text-peak-charcoal hover:bg-peak-cream/80 active:bg-peak-cream/70 border border-peak-charcoal/10",
  ghost: "bg-transparent text-peak-charcoal hover:bg-peak-charcoal/5 active:bg-peak-charcoal/10",
  danger: "bg-peak-burgundy text-white hover:bg-peak-burgundy/90 active:bg-peak-burgundy/80",
  success: "bg-peak-forest text-white hover:bg-peak-forest/90 active:bg-peak-forest/80",
};

const sizeStyles: Record<PeakButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const PeakButton = forwardRef<HTMLButtonElement, PeakButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-peak transition-colors focus:outline-none focus:ring-2 focus:ring-peak-forest/50 disabled:opacity-50 disabled:cursor-not-allowed";
    
    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 animate-spin">⏳</span>
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        
        {children}
        
        {rightIcon && !isLoading && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

PeakButton.displayName = "PeakButton";

export default PeakButton;
