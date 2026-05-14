/**
 * Input validation utilities for Peak
 * Validates equipment, bookings, and search inputs
 */

import type { EquipmentFormData } from "./types";

type BookingValidationInput = {
  startDate?: string | Date;
  endDate?: string | Date;
  equipmentId?: string;
};

export function validateEquipment(data: EquipmentFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  // Title validation
  if (!data.title || !data.title.trim()) {
    errors.title = "Title is required";
  } else if (data.title.length > 100) {
    errors.title = "Title must be less than 100 characters";
  }

  // Description validation
  if (!data.description || !data.description.trim()) {
    errors.description = "Description is required";
  } else if (data.description.length > 2000) {
    errors.description = "Description must be less than 2000 characters";
  }

  // Category validation
  if (!data.category || !data.category.trim()) {
    errors.category = "Category is required";
  }

  // Daily rate validation
  if (data.dailyRate === undefined || data.dailyRate === null) {
    errors.dailyRate = "Daily rate is required";
  } else if (!Number.isFinite(data.dailyRate) || data.dailyRate < 0) {
    errors.dailyRate = "Daily rate must be a positive number (in cents)";
  } else if (data.dailyRate > 100000000) {
    errors.dailyRate = "Daily rate is unreasonably high";
  }

  // Hour meter validation (optional)
  if (data.hourMeter !== undefined && data.hourMeter !== null) {
    if (!Number.isFinite(data.hourMeter) || data.hourMeter < 0) {
      errors.hourMeter = "Hour meter must be a positive number";
    }
  }

  // Location validation (optional)
  if (data.location && data.location.length > 255) {
    errors.location = "Location must be less than 255 characters";
  }

  return errors;
}

export function validateBooking(data: BookingValidationInput): Record<string, string> {
  const errors: Record<string, string> = {};

  // Start date validation
  if (!data.startDate) {
    errors.startDate = "Start date is required";
  } else {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.startDate = "Invalid start date format";
    } else if (startDate < new Date()) {
      errors.startDate = "Start date cannot be in the past";
    }
  }

  // End date validation
  if (!data.endDate) {
    errors.endDate = "End date is required";
  } else {
    const endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      errors.endDate = "Invalid end date format";
    } else if (data.startDate) {
      const startDate = new Date(data.startDate);
      if (endDate <= startDate) {
        errors.endDate = "End date must be after start date";
      }
    }
  }

  // Equipment ID validation
  if (!data.equipmentId || typeof data.equipmentId !== "string" || !data.equipmentId.trim()) {
    errors.equipmentId = "Equipment is required";
  }

  return errors;
}

export function validateSearch(query: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmed = query.trim();

  if (!trimmed) {
    errors.query = "Search query cannot be empty";
  } else if (trimmed.length > 100) {
    errors.query = "Search query must be less than 100 characters";
  }

  return errors;
}

export function validateCheckout(data: {
  equipmentId?: string;
  days?: number;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.equipmentId || !data.equipmentId.trim()) {
    errors.equipmentId = "Equipment is required";
  }

  if (data.days === undefined || data.days === null) {
    errors.days = "Rental days is required";
  } else if (!Number.isFinite(data.days) || data.days <= 0) {
    errors.days = "Rental days must be a positive number";
  } else if (!Number.isInteger(data.days)) {
    errors.days = "Rental days must be a whole number";
  }

  return errors;
}

/**
 * Checks if a validation result has any errors
 */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Formats validation errors for API response
 */
export function formatValidationErrors(errors: Record<string, string>) {
  return {
    error: "Validation failed",
    errors,
  };
}
