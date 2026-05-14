"use client";

import { forwardRef } from "react";

// Simple class name utility (filters falsy values and joins)
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// =============================================================================
// PEAK INPUT
// =============================================================================

export interface PeakInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message - when present, input shows error state */
  error?: string;
  /** Optional icon displayed on the left side of the input */
  icon?: React.ReactNode;
}

export const PeakInput = forwardRef<HTMLInputElement, PeakInputProps>(
  ({ className, label, helperText, error, icon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const hasError = Boolean(error);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium font-sans text-peak-charcoal"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-peak-slate pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base styles
              "w-full rounded-peak border bg-peak-snow px-4 py-2.5",
              "font-sans text-peak-charcoal placeholder:text-peak-slate",
              "transition-all duration-200",
              // Focus styles
              "focus:outline-none focus:ring-2 focus:ring-peak-forest-500 focus:ring-offset-1",
              // Default border
              !hasError && "border-peak-stone focus:border-peak-forest",
              // Error state
              hasError && "border-peak-burgundy focus:ring-peak-burgundy/30 focus:border-peak-burgundy",
              // Icon padding
              icon && "pl-10",
              // Disabled state
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-peak-stone/30",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm font-sans text-peak-burgundy"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-sm font-sans text-peak-slate"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PeakInput.displayName = "PeakInput";

// =============================================================================
// PEAK TEXTAREA
// =============================================================================

export interface PeakTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text displayed above the textarea */
  label?: string;
  /** Helper text displayed below the textarea */
  helperText?: string;
  /** Error message - when present, textarea shows error state */
  error?: string;
}

export const PeakTextarea = forwardRef<HTMLTextAreaElement, PeakTextareaProps>(
  ({ className, label, helperText, error, id, rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const hasError = Boolean(error);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium font-sans text-peak-charcoal"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            // Base styles
            "w-full rounded-peak border bg-peak-snow px-4 py-2.5",
            "font-sans text-peak-charcoal placeholder:text-peak-slate",
            "transition-all duration-200 resize-vertical min-h-[100px]",
            // Focus styles
            "focus:outline-none focus:ring-2 focus:ring-peak-forest-500 focus:ring-offset-1",
            // Default border
            !hasError && "border-peak-stone focus:border-peak-forest",
            // Error state
            hasError && "border-peak-burgundy focus:ring-peak-burgundy/30 focus:border-peak-burgundy",
            // Disabled state
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-peak-stone/30",
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-sm font-sans text-peak-burgundy"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${textareaId}-helper`}
            className="text-sm font-sans text-peak-slate"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PeakTextarea.displayName = "PeakTextarea";

// =============================================================================
// PEAK SELECT
// =============================================================================

export interface SelectOption {
  /** The value submitted when this option is selected */
  value: string;
  /** The label displayed to the user */
  label: string;
  /** Whether this option is disabled */
  disabled?: boolean;
}

export interface PeakSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  /** Label text displayed above the select */
  label?: string;
  /** Helper text displayed below the select */
  helperText?: string;
  /** Error message - when present, select shows error state */
  error?: string;
  /** Array of options to display */
  options: SelectOption[];
  /** Placeholder text shown when no option is selected */
  placeholder?: string;
}

export const PeakSelect = forwardRef<HTMLSelectElement, PeakSelectProps>(
  (
    { className, label, helperText, error, options, placeholder, id, ...props },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const hasError = Boolean(error);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium font-sans text-peak-charcoal"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              // Base styles
              "w-full rounded-peak border bg-peak-snow px-4 py-2.5 pr-10",
              "font-sans text-peak-charcoal",
              "transition-all duration-200",
              "appearance-none cursor-pointer",
              // Focus styles
              "focus:outline-none focus:ring-2 focus:ring-peak-forest-500 focus:ring-offset-1",
              // Default border
              !hasError && "border-peak-stone focus:border-peak-forest",
              // Error state
              hasError && "border-peak-burgundy focus:ring-peak-burgundy/30 focus:border-peak-burgundy",
              // Disabled state
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-peak-stone/30",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-peak-slate">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-peak-slate">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p
            id={`${selectId}-error`}
            className="text-sm font-sans text-peak-burgundy"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${selectId}-helper`}
            className="text-sm font-sans text-peak-slate"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PeakSelect.displayName = "PeakSelect";
