import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface PeakInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const PeakInput = forwardRef<HTMLInputElement, PeakInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `peak-input-${Math.random().toString(36).slice(2)}`;
    const hasError = !!error;

    const baseInputStyles = `
      w-full px-4 py-2 rounded-peak border bg-white text-peak-charcoal
      placeholder:text-peak-charcoal/40
      focus:outline-none focus:ring-2 focus:ring-peak-forest/50 focus:border-peak-forest
      disabled:bg-peak-cream/50 disabled:cursor-not-allowed
      transition-colors
    `;

    const errorStyles = hasError
      ? "border-peak-burgundy focus:ring-peak-burgundy/50 focus:border-peak-burgundy"
      : "border-peak-charcoal/20";

    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-peak-charcoal mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <span className="absolute left-3 text-peak-charcoal/50">
              {leftAddon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              ${baseInputStyles}
              ${errorStyles}
              ${leftAddon ? "pl-10" : ""}
              ${rightAddon ? "pr-10" : ""}
            `}
            {...props}
          />

          {rightAddon && (
            <span className="absolute right-3 text-peak-charcoal/50">
              {rightAddon}
            </span>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={`mt-1 text-xs ${
              hasError ? "text-peak-burgundy" : "text-peak-charcoal/60"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

PeakInput.displayName = "PeakInput";

// Textarea variant
interface PeakTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const PeakTextarea = forwardRef<HTMLTextAreaElement, PeakTextareaProps>(
  (
    {
      label,
      error,
      helperText,
      className = "",
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const inputId = id || `peak-textarea-${Math.random().toString(36).slice(2)}`;
    const hasError = !!error;

    const baseStyles = `
      w-full px-4 py-2 rounded-peak border bg-white text-peak-charcoal
      placeholder:text-peak-charcoal/40
      focus:outline-none focus:ring-2 focus:ring-peak-forest/50 focus:border-peak-forest
      disabled:bg-peak-cream/50 disabled:cursor-not-allowed
      resize-none transition-colors
    `;

    const errorStyles = hasError
      ? "border-peak-burgundy focus:ring-peak-burgundy/50 focus:border-peak-burgundy"
      : "border-peak-charcoal/20";

    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-peak-charcoal mb-1"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`${baseStyles} ${errorStyles}`}
          {...props}
        />

        {(error || helperText) && (
          <p
            className={`mt-1 text-xs ${
              hasError ? "text-peak-burgundy" : "text-peak-charcoal/60"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

PeakTextarea.displayName = "PeakTextarea";

// Select variant
interface PeakSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export const PeakSelect = forwardRef<HTMLSelectElement, PeakSelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `peak-select-${Math.random().toString(36).slice(2)}`;
    const hasError = !!error;

    const baseStyles = `
      w-full px-4 py-2 rounded-peak border bg-white text-peak-charcoal
      focus:outline-none focus:ring-2 focus:ring-peak-forest/50 focus:border-peak-forest
      disabled:bg-peak-cream/50 disabled:cursor-not-allowed
      cursor-pointer transition-colors appearance-none
      bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23333%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')]
      bg-[length:0.7em] bg-[right_0.75rem_center] bg-no-repeat
      pr-10
    `;

    const errorStyles = hasError
      ? "border-peak-burgundy focus:ring-peak-burgundy/50 focus:border-peak-burgundy"
      : "border-peak-charcoal/20";

    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-peak-charcoal mb-1"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={inputId}
          className={`${baseStyles} ${errorStyles}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {(error || helperText) && (
          <p
            className={`mt-1 text-xs ${
              hasError ? "text-peak-burgundy" : "text-peak-charcoal/60"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

PeakSelect.displayName = "PeakSelect";

export default PeakInput;
