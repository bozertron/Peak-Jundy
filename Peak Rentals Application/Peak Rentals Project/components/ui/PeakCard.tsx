import { forwardRef, HTMLAttributes } from "react";

export type PeakCardVariant = "default" | "elevated" | "outlined" | "polaroid";

interface PeakCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PeakCardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

const variantStyles: Record<PeakCardVariant, string> = {
  default: "bg-white",
  elevated: "bg-white shadow-peak",
  outlined: "bg-white border border-peak-charcoal/10",
  polaroid: "bg-white shadow-peak peak-polaroid",
};

const paddingStyles: Record<"none" | "sm" | "md" | "lg", string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const PeakCard = forwardRef<HTMLDivElement, PeakCardProps>(
  (
    {
      variant = "elevated",
      padding = "md",
      hoverable = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = "rounded-peak overflow-hidden";
    const hoverStyles = hoverable ? "transition-all hover:shadow-lg hover:-translate-y-0.5" : "";
    
    return (
      <div
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${hoverStyles}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PeakCard.displayName = "PeakCard";

// Card Header subcomponent
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PeakCardHeader({
  title,
  subtitle,
  action,
  className = "",
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between ${className}`} {...props}>
      {children || (
        <>
          <div>
            {title && (
              <h3 className="font-serif text-lg font-bold text-peak-charcoal">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-peak-charcoal/60">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </>
      )}
    </div>
  );
}

// Card Body subcomponent
export function PeakCardBody({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

// Card Footer subcomponent
export function PeakCardFooter({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center gap-2 pt-4 border-t border-peak-charcoal/10 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default PeakCard;
