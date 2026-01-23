/**
 * Comprehensive unit tests for lib/validation.ts
 * Tests edge cases, security concerns, type coercion, and boundary conditions
 */

import {
  validateEquipment,
  validateBooking,
  validateSearch,
  validateCheckout,
  hasErrors,
  formatValidationErrors,
} from "@/lib/validation";
import type { EquipmentFormData } from "@/lib/types";

// ============================================================================
// Test Utilities & Fixtures
// ============================================================================

const validEquipmentData: EquipmentFormData = {
  title: "Caterpillar 320 Excavator",
  description: "Heavy-duty excavator in excellent condition with low hours",
  category: "Excavators",
  dailyRate: 35000, // $350.00 in cents
  available: true,
  location: "Denver, CO",
  hourMeter: 2500,
};

const createEquipmentData = (
  overrides: Partial<EquipmentFormData> = {}
): EquipmentFormData => ({
  ...validEquipmentData,
  ...overrides,
});

// SQL Injection attack strings
const SQL_INJECTION_VECTORS = [
  "'; DROP TABLE equipment; --",
  "1' OR '1'='1",
  "1; DELETE FROM users WHERE 1=1; --",
  "admin'--",
  "' OR 1=1 --",
  "UNION SELECT * FROM users --",
  "'; EXEC xp_cmdshell('format c:'); --",
  "1' AND (SELECT COUNT(*) FROM users) > 0 --",
  "'; INSERT INTO users VALUES('hacker','hacked'); --",
  "Robert'); DROP TABLE Students;--",
];

// XSS attack strings
const XSS_VECTORS = [
  "<script>alert('XSS')</script>",
  '<img src="x" onerror="alert(1)">',
  "<svg onload=\"alert('XSS')\">",
  'javascript:alert("XSS")',
  '<a href="javascript:alert(1)">click</a>',
  '<body onload="alert(1)">',
  '<iframe src="javascript:alert(1)">',
  "{{constructor.constructor('alert(1)')()}}",
  "<div style=\"background:url('javascript:alert(1)')\">",
  '%3Cscript%3Ealert(1)%3C/script%3E',
];

// Prototype pollution vectors
const PROTOTYPE_POLLUTION_VECTORS = [
  "__proto__",
  "constructor",
  "prototype",
  "__proto__[admin]",
  "constructor.prototype",
];

// Unicode edge cases
const UNICODE_STRINGS = [
  "\u0000", // Null character
  "\uFEFF", // BOM
  "\u200B", // Zero-width space
  "\u200E", // Left-to-right mark
  "\u202E", // Right-to-left override
  "𝕳𝖊𝖑𝖑𝖔", // Mathematical bold fraktur
  "Ḧëḷḷö", // Combining diacriticals
  "مرحبا", // Arabic
  "你好", // Chinese
  "🎉🔥💯", // Emojis
  "\uD800\uDC00", // Surrogate pair (valid)
];

// Type coercion attack objects
const createCoercionAttackObject = (
  stringValue: string
): { toString: () => string } => ({
  toString: () => stringValue,
});

// ============================================================================
// validateEquipment Tests
// ============================================================================

describe("validateEquipment", () => {
  describe("valid inputs", () => {
    it("should accept valid equipment data with all fields", () => {
      const errors = validateEquipment(validEquipmentData);
      expect(errors).toEqual({});
    });

    it("should accept minimal valid equipment data", () => {
      const minimalData: EquipmentFormData = {
        title: "Excavator",
        description: "A good excavator",
        category: "Heavy Equipment",
        dailyRate: 10000,
      };
      const errors = validateEquipment(minimalData);
      expect(errors).toEqual({});
    });

    it("should accept title with exactly 100 characters (boundary)", () => {
      const errors = validateEquipment(
        createEquipmentData({ title: "a".repeat(100) })
      );
      expect(errors.title).toBeUndefined();
    });

    it("should accept description with exactly 2000 characters (boundary)", () => {
      const errors = validateEquipment(
        createEquipmentData({ description: "a".repeat(2000) })
      );
      expect(errors.description).toBeUndefined();
    });

    it("should accept location with exactly 255 characters (boundary)", () => {
      const errors = validateEquipment(
        createEquipmentData({ location: "a".repeat(255) })
      );
      expect(errors.location).toBeUndefined();
    });

    it("should accept dailyRate of 0 (free rentals)", () => {
      const errors = validateEquipment(createEquipmentData({ dailyRate: 0 }));
      expect(errors.dailyRate).toBeUndefined();
    });

    it("should accept dailyRate at maximum boundary (100000000)", () => {
      const errors = validateEquipment(
        createEquipmentData({ dailyRate: 100000000 })
      );
      expect(errors.dailyRate).toBeUndefined();
    });

    it("should accept hourMeter of 0", () => {
      const errors = validateEquipment(createEquipmentData({ hourMeter: 0 }));
      expect(errors.hourMeter).toBeUndefined();
    });

    it("should accept very large hourMeter values", () => {
      const errors = validateEquipment(
        createEquipmentData({ hourMeter: 999999999 })
      );
      expect(errors.hourMeter).toBeUndefined();
    });

    it("should accept null hourMeter (optional field)", () => {
      const errors = validateEquipment(createEquipmentData({ hourMeter: null }));
      expect(errors.hourMeter).toBeUndefined();
    });

    it("should accept undefined hourMeter (optional field)", () => {
      const errors = validateEquipment(
        createEquipmentData({ hourMeter: undefined })
      );
      expect(errors.hourMeter).toBeUndefined();
    });
  });

  describe("title validation", () => {
    it("should reject empty title", () => {
      const errors = validateEquipment(createEquipmentData({ title: "" }));
      expect(errors.title).toBe("Title is required");
    });

    it("should reject whitespace-only title", () => {
      const errors = validateEquipment(createEquipmentData({ title: "   " }));
      expect(errors.title).toBe("Title is required");
    });

    it("should reject title with only tabs and newlines", () => {
      const errors = validateEquipment(
        createEquipmentData({ title: "\t\n\r" })
      );
      expect(errors.title).toBe("Title is required");
    });

    it("should reject title exceeding 100 characters", () => {
      const errors = validateEquipment(
        createEquipmentData({ title: "a".repeat(101) })
      );
      expect(errors.title).toBe("Title must be less than 100 characters");
    });

    it("should count Unicode characters correctly in title", () => {
      // 99 emojis + 1 regular char = 100 characters (if counted as code points)
      // But emojis may be multiple code units
      const emojiTitle = "🎉".repeat(100);
      const errors = validateEquipment(createEquipmentData({ title: emojiTitle }));
      // This tests if length is checking by code unit or grapheme
      // The implementation uses .length which counts UTF-16 code units
      // Each emoji is 2 code units, so 200 > 100
      expect(errors.title).toBe("Title must be less than 100 characters");
    });

    it("should throw for title with null prototype object (no trim method)", () => {
      const data = createEquipmentData();
      // @ts-expect-error - Testing runtime behavior with invalid type
      data.title = Object.create(null);
      // Objects without prototype don't have trim() method, so validation throws
      expect(() => validateEquipment(data)).toThrow();
    });
  });

  describe("description validation", () => {
    it("should reject empty description", () => {
      const errors = validateEquipment(
        createEquipmentData({ description: "" })
      );
      expect(errors.description).toBe("Description is required");
    });

    it("should reject whitespace-only description", () => {
      const errors = validateEquipment(
        createEquipmentData({ description: "     " })
      );
      expect(errors.description).toBe("Description is required");
    });

    it("should reject description exceeding 2000 characters", () => {
      const errors = validateEquipment(
        createEquipmentData({ description: "a".repeat(2001) })
      );
      expect(errors.description).toBe(
        "Description must be less than 2000 characters"
      );
    });

    it("should handle description with mixed Unicode and ASCII", () => {
      const mixedDescription = "Hello 你好 مرحبا 🎉".repeat(50);
      const errors = validateEquipment(
        createEquipmentData({ description: mixedDescription })
      );
      // If the description is within length limits, no error is expected
      // If it exceeds 2000 chars, an error is returned
      // Just verify it doesn't crash and returns a valid errors object
      expect(errors).toBeDefined();
      expect(typeof errors).toBe("object");
    });
  });

  describe("category validation", () => {
    it("should reject empty category", () => {
      const errors = validateEquipment(createEquipmentData({ category: "" }));
      expect(errors.category).toBe("Category is required");
    });

    it("should reject whitespace-only category", () => {
      const errors = validateEquipment(
        createEquipmentData({ category: "   " })
      );
      expect(errors.category).toBe("Category is required");
    });

    it("should accept any non-empty string as category", () => {
      const errors = validateEquipment(
        createEquipmentData({ category: "Anything123!@#" })
      );
      expect(errors.category).toBeUndefined();
    });
  });

  describe("dailyRate validation", () => {
    it("should reject undefined dailyRate", () => {
      const data = createEquipmentData();
      // @ts-expect-error - Testing runtime behavior
      data.dailyRate = undefined;
      const errors = validateEquipment(data);
      expect(errors.dailyRate).toBe("Daily rate is required");
    });

    it("should reject null dailyRate", () => {
      const data = createEquipmentData();
      // @ts-expect-error - Testing runtime behavior
      data.dailyRate = null;
      const errors = validateEquipment(data);
      expect(errors.dailyRate).toBe("Daily rate is required");
    });

    it("should reject negative dailyRate", () => {
      const errors = validateEquipment(createEquipmentData({ dailyRate: -1 }));
      expect(errors.dailyRate).toBe(
        "Daily rate must be a positive number (in cents)"
      );
    });

    it("should reject NaN dailyRate", () => {
      const errors = validateEquipment(createEquipmentData({ dailyRate: NaN }));
      expect(errors.dailyRate).toBe(
        "Daily rate must be a positive number (in cents)"
      );
    });

    it("should reject Infinity dailyRate", () => {
      const errors = validateEquipment(
        createEquipmentData({ dailyRate: Infinity })
      );
      expect(errors.dailyRate).toBe(
        "Daily rate must be a positive number (in cents)"
      );
    });

    it("should reject negative Infinity dailyRate", () => {
      const errors = validateEquipment(
        createEquipmentData({ dailyRate: -Infinity })
      );
      expect(errors.dailyRate).toBe(
        "Daily rate must be a positive number (in cents)"
      );
    });

    it("should reject dailyRate exceeding maximum (100000001)", () => {
      const errors = validateEquipment(
        createEquipmentData({ dailyRate: 100000001 })
      );
      expect(errors.dailyRate).toBe("Daily rate is unreasonably high");
    });

    it("should accept decimal dailyRate (floating point)", () => {
      const errors = validateEquipment(
        createEquipmentData({ dailyRate: 100.50 })
      );
      // The validation allows floats for cents
      expect(errors.dailyRate).toBeUndefined();
    });

    it("should handle string that looks like number (type coercion)", () => {
      const data = createEquipmentData();
      // @ts-expect-error - Testing runtime type coercion
      data.dailyRate = "10000";
      const errors = validateEquipment(data);
      // Number.isFinite("10000") returns false
      expect(errors.dailyRate).toBe(
        "Daily rate must be a positive number (in cents)"
      );
    });

    it("should handle array type coercion attack", () => {
      const data = createEquipmentData();
      // @ts-expect-error - Testing type coercion attack
      data.dailyRate = [10000]; // [10000].toString() = "10000"
      const errors = validateEquipment(data);
      expect(errors.dailyRate).toBeDefined();
    });

    it("should handle object with valueOf type coercion", () => {
      const data = createEquipmentData();
      // @ts-expect-error - Testing type coercion attack
      data.dailyRate = { valueOf: () => 10000 };
      const errors = validateEquipment(data);
      // Number.isFinite(object) returns false
      expect(errors.dailyRate).toBeDefined();
    });
  });

  describe("hourMeter validation", () => {
    it("should reject negative hourMeter", () => {
      const errors = validateEquipment(createEquipmentData({ hourMeter: -1 }));
      expect(errors.hourMeter).toBe("Hour meter must be a positive number");
    });

    it("should reject NaN hourMeter", () => {
      const errors = validateEquipment(createEquipmentData({ hourMeter: NaN }));
      expect(errors.hourMeter).toBe("Hour meter must be a positive number");
    });

    it("should reject Infinity hourMeter", () => {
      const errors = validateEquipment(
        createEquipmentData({ hourMeter: Infinity })
      );
      expect(errors.hourMeter).toBe("Hour meter must be a positive number");
    });
  });

  describe("location validation", () => {
    it("should accept empty location (optional field)", () => {
      const errors = validateEquipment(createEquipmentData({ location: "" }));
      expect(errors.location).toBeUndefined();
    });

    it("should accept null location", () => {
      const errors = validateEquipment(createEquipmentData({ location: null }));
      expect(errors.location).toBeUndefined();
    });

    it("should reject location exceeding 255 characters", () => {
      const errors = validateEquipment(
        createEquipmentData({ location: "a".repeat(256) })
      );
      expect(errors.location).toBe("Location must be less than 255 characters");
    });
  });

  describe("security - SQL injection vectors", () => {
    SQL_INJECTION_VECTORS.forEach((vector) => {
      it(`should handle SQL injection in title: ${vector.substring(0, 30)}...`, () => {
        const errors = validateEquipment(createEquipmentData({ title: vector }));
        // Should not throw, validation passes structural check
        // (sanitization is a separate concern)
        expect(errors.title).toBeUndefined();
      });

      it(`should handle SQL injection in description: ${vector.substring(0, 30)}...`, () => {
        const errors = validateEquipment(
          createEquipmentData({ description: vector })
        );
        expect(errors.description).toBeUndefined();
      });
    });
  });

  describe("security - XSS vectors", () => {
    XSS_VECTORS.forEach((vector) => {
      it(`should handle XSS in title: ${vector.substring(0, 30)}...`, () => {
        const errors = validateEquipment(createEquipmentData({ title: vector }));
        // Validation passes, XSS prevention is output escaping concern
        expect(errors.title).toBeUndefined();
      });
    });
  });

  describe("security - prototype pollution vectors", () => {
    PROTOTYPE_POLLUTION_VECTORS.forEach((vector) => {
      it(`should handle prototype pollution key: ${vector}`, () => {
        const errors = validateEquipment(createEquipmentData({ title: vector }));
        expect(errors.title).toBeUndefined();
      });
    });
  });

  describe("Unicode edge cases", () => {
    UNICODE_STRINGS.forEach((str) => {
      it(`should handle Unicode string: ${JSON.stringify(str)}`, () => {
        const errors = validateEquipment(createEquipmentData({ title: str }));
        // Most Unicode strings are valid as titles (if non-empty after trim)
        // Null character and zero-width chars might trim to empty
        expect(() => validateEquipment(createEquipmentData({ title: str }))).not.toThrow();
      });
    });

    it("should handle zero-width space in title", () => {
      // Zero-width space alone should fail validation (empty after visual)
      const errors = validateEquipment(
        createEquipmentData({ title: "\u200B" })
      );
      // trim() doesn't remove zero-width space, so it passes
      // This is a potential edge case to be aware of
      expect(errors.title).toBeUndefined(); // Current behavior
    });
  });

  describe("edge cases - missing/malformed data", () => {
    it("should handle completely empty object", () => {
      // @ts-expect-error - Testing runtime behavior
      const errors = validateEquipment({});
      expect(errors.title).toBe("Title is required");
      expect(errors.description).toBe("Description is required");
      expect(errors.category).toBe("Category is required");
      expect(errors.dailyRate).toBe("Daily rate is required");
    });

    it("should handle null input", () => {
      // @ts-expect-error - Testing runtime behavior
      expect(() => validateEquipment(null)).toThrow();
    });

    it("should handle undefined input", () => {
      // @ts-expect-error - Testing runtime behavior
      expect(() => validateEquipment(undefined)).toThrow();
    });

    it("should handle array input", () => {
      // @ts-expect-error - Testing runtime behavior
      expect(() => validateEquipment([])).not.toThrow();
    });

    it("should handle function input", () => {
      // @ts-expect-error - Testing runtime behavior
      const errors = validateEquipment(() => {});
      expect(errors.title).toBe("Title is required");
    });
  });

  describe("multiple errors", () => {
    it("should return all errors at once", () => {
      const errors = validateEquipment({
        title: "",
        description: "",
        category: "",
        dailyRate: -1,
        hourMeter: -5,
        location: "a".repeat(300),
      });

      expect(Object.keys(errors).length).toBeGreaterThanOrEqual(5);
      expect(errors.title).toBeDefined();
      expect(errors.description).toBeDefined();
      expect(errors.category).toBeDefined();
      expect(errors.dailyRate).toBeDefined();
      expect(errors.hourMeter).toBeDefined();
      expect(errors.location).toBeDefined();
    });
  });
});

// ============================================================================
// validateBooking Tests
// ============================================================================

describe("validateBooking", () => {
  // Use a date far in the future to avoid time-sensitive test failures
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  const futureDateEnd = new Date(futureDate);
  futureDateEnd.setDate(futureDateEnd.getDate() + 7);

  describe("valid inputs", () => {
    it("should accept valid booking with Date objects", () => {
      const errors = validateBooking({
        startDate: futureDate,
        endDate: futureDateEnd,
        equipmentId: "equip-123",
      });
      expect(errors).toEqual({});
    });

    it("should accept valid booking with ISO date strings", () => {
      const errors = validateBooking({
        startDate: futureDate.toISOString(),
        endDate: futureDateEnd.toISOString(),
        equipmentId: "equip-123",
      });
      expect(errors).toEqual({});
    });

    it("should accept valid booking with date strings", () => {
      const startStr = futureDate.toISOString().split("T")[0];
      const endStr = futureDateEnd.toISOString().split("T")[0];
      const errors = validateBooking({
        startDate: startStr,
        endDate: endStr,
        equipmentId: "equip-123",
      });
      expect(errors).toEqual({});
    });
  });

  describe("startDate validation", () => {
    it("should reject missing startDate", () => {
      const errors = validateBooking({
        endDate: futureDateEnd,
        equipmentId: "equip-123",
      });
      expect(errors.startDate).toBe("Start date is required");
    });

    it("should reject empty string startDate", () => {
      const errors = validateBooking({
        startDate: "",
        endDate: futureDateEnd,
        equipmentId: "equip-123",
      });
      expect(errors.startDate).toBe("Start date is required");
    });

    it("should reject invalid date format", () => {
      const errors = validateBooking({
        startDate: "not-a-date",
        endDate: futureDateEnd,
        equipmentId: "equip-123",
      });
      expect(errors.startDate).toBe("Invalid start date format");
    });

    it("should reject past startDate", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const errors = validateBooking({
        startDate: pastDate,
        endDate: futureDateEnd,
        equipmentId: "equip-123",
      });
      expect(errors.startDate).toBe("Start date cannot be in the past");
    });

    it("should handle startDate with invalid month (13)", () => {
      const errors = validateBooking({
        startDate: "2030-13-01",
        endDate: futureDateEnd,
        equipmentId: "equip-123",
      });
      expect(errors.startDate).toBe("Invalid start date format");
    });

    it("should handle startDate with invalid day (32)", () => {
      const errors = validateBooking({
        startDate: "2030-01-32",
        endDate: futureDateEnd,
        equipmentId: "equip-123",
      });
      expect(errors.startDate).toBe("Invalid start date format");
    });
  });

  describe("endDate validation", () => {
    it("should reject missing endDate", () => {
      const errors = validateBooking({
        startDate: futureDate,
        equipmentId: "equip-123",
      });
      expect(errors.endDate).toBe("End date is required");
    });

    it("should reject invalid endDate format", () => {
      const errors = validateBooking({
        startDate: futureDate,
        endDate: "invalid",
        equipmentId: "equip-123",
      });
      expect(errors.endDate).toBe("Invalid end date format");
    });

    it("should reject endDate before startDate", () => {
      const errors = validateBooking({
        startDate: futureDateEnd,
        endDate: futureDate,
        equipmentId: "equip-123",
      });
      expect(errors.endDate).toBe("End date must be after start date");
    });

    it("should reject endDate equal to startDate", () => {
      const errors = validateBooking({
        startDate: futureDate,
        endDate: futureDate,
        equipmentId: "equip-123",
      });
      expect(errors.endDate).toBe("End date must be after start date");
    });

    it("should accept endDate just 1ms after startDate", () => {
      const start = new Date(futureDate);
      const end = new Date(start.getTime() + 1);
      const errors = validateBooking({
        startDate: start,
        endDate: end,
        equipmentId: "equip-123",
      });
      expect(errors.endDate).toBeUndefined();
    });
  });

  describe("equipmentId validation", () => {
    it("should reject missing equipmentId", () => {
      const errors = validateBooking({
        startDate: futureDate,
        endDate: futureDateEnd,
      });
      expect(errors.equipmentId).toBe("Equipment is required");
    });

    it("should reject empty string equipmentId", () => {
      const errors = validateBooking({
        startDate: futureDate,
        endDate: futureDateEnd,
        equipmentId: "",
      });
      expect(errors.equipmentId).toBe("Equipment is required");
    });

    it("should reject whitespace-only equipmentId", () => {
      const errors = validateBooking({
        startDate: futureDate,
        endDate: futureDateEnd,
        equipmentId: "   ",
      });
      expect(errors.equipmentId).toBe("Equipment is required");
    });

    it("should reject non-string equipmentId", () => {
      const errors = validateBooking({
        startDate: futureDate,
        endDate: futureDateEnd,
        // @ts-expect-error - Testing runtime behavior
        equipmentId: 12345,
      });
      expect(errors.equipmentId).toBe("Equipment is required");
    });

    it("should reject null equipmentId", () => {
      const errors = validateBooking({
        startDate: futureDate,
        endDate: futureDateEnd,
        // @ts-expect-error - Testing runtime behavior
        equipmentId: null,
      });
      expect(errors.equipmentId).toBe("Equipment is required");
    });

    it("should accept any non-empty string as equipmentId", () => {
      const errors = validateBooking({
        startDate: futureDate,
        endDate: futureDateEnd,
        equipmentId: "any-string-works-123",
      });
      expect(errors.equipmentId).toBeUndefined();
    });
  });

  describe("date edge cases", () => {
    it("should handle Date object with invalid time (NaN)", () => {
      const errors = validateBooking({
        startDate: new Date("invalid"),
        endDate: futureDateEnd,
        equipmentId: "equip-123",
      });
      expect(errors.startDate).toBe("Invalid start date format");
    });

    it("should handle Unix timestamp strings", () => {
      const timestamp = (futureDate.getTime()).toString();
      const errors = validateBooking({
        startDate: timestamp,
        endDate: futureDateEnd,
        equipmentId: "equip-123",
      });
      // new Date("1609459200000") creates Invalid Date
      expect(errors.startDate).toBeDefined();
    });

    it("should handle very far future dates", () => {
      const farFuture = new Date("3000-01-01");
      const farFutureEnd = new Date("3000-01-08");
      const errors = validateBooking({
        startDate: farFuture,
        endDate: farFutureEnd,
        equipmentId: "equip-123",
      });
      expect(errors).toEqual({});
    });

    it("should handle date at Unix epoch boundary", () => {
      // Date at year 1970 is always in the past
      const epochDate = new Date(0);
      const errors = validateBooking({
        startDate: epochDate,
        endDate: futureDateEnd,
        equipmentId: "equip-123",
      });
      expect(errors.startDate).toBe("Start date cannot be in the past");
    });
  });

  describe("security - injection in equipmentId", () => {
    SQL_INJECTION_VECTORS.forEach((vector) => {
      it(`should accept SQL injection string as equipmentId: ${vector.substring(0, 20)}...`, () => {
        const errors = validateBooking({
          startDate: futureDate,
          endDate: futureDateEnd,
          equipmentId: vector,
        });
        // Validation only checks for non-empty string
        expect(errors.equipmentId).toBeUndefined();
      });
    });
  });

  describe("multiple errors", () => {
    it("should return all errors simultaneously", () => {
      const errors = validateBooking({});
      expect(errors.startDate).toBe("Start date is required");
      expect(errors.endDate).toBe("End date is required");
      expect(errors.equipmentId).toBe("Equipment is required");
    });
  });
});

// ============================================================================
// validateSearch Tests
// ============================================================================

describe("validateSearch", () => {
  describe("valid inputs", () => {
    it("should accept valid search query", () => {
      const errors = validateSearch("excavator");
      expect(errors).toEqual({});
    });

    it("should accept single character query", () => {
      const errors = validateSearch("a");
      expect(errors).toEqual({});
    });

    it("should accept query with leading/trailing spaces (trimmed)", () => {
      const errors = validateSearch("  excavator  ");
      expect(errors).toEqual({});
    });

    it("should accept query at exactly 100 characters (boundary)", () => {
      const errors = validateSearch("a".repeat(100));
      expect(errors).toEqual({});
    });

    it("should accept query with special characters", () => {
      const errors = validateSearch("excavator !@#$%^&*()");
      expect(errors).toEqual({});
    });

    it("should accept numeric queries", () => {
      const errors = validateSearch("123456");
      expect(errors).toEqual({});
    });
  });

  describe("invalid inputs", () => {
    it("should reject empty string", () => {
      const errors = validateSearch("");
      expect(errors.query).toBe("Search query cannot be empty");
    });

    it("should reject whitespace-only string", () => {
      const errors = validateSearch("     ");
      expect(errors.query).toBe("Search query cannot be empty");
    });

    it("should reject tabs and newlines only", () => {
      const errors = validateSearch("\t\n\r");
      expect(errors.query).toBe("Search query cannot be empty");
    });

    it("should reject query exceeding 100 characters", () => {
      const errors = validateSearch("a".repeat(101));
      expect(errors.query).toBe("Search query must be less than 100 characters");
    });

    it("should reject very long query (1000 characters)", () => {
      const errors = validateSearch("a".repeat(1000));
      expect(errors.query).toBe("Search query must be less than 100 characters");
    });
  });

  describe("security - SQL injection", () => {
    SQL_INJECTION_VECTORS.forEach((vector) => {
      it(`should handle SQL injection: ${vector.substring(0, 30)}...`, () => {
        const errors = validateSearch(vector);
        // Validation only checks length and emptiness
        if (vector.trim().length > 0 && vector.length <= 100) {
          expect(errors).toEqual({});
        } else if (vector.length > 100) {
          expect(errors.query).toBe("Search query must be less than 100 characters");
        }
      });
    });
  });

  describe("security - XSS vectors", () => {
    XSS_VECTORS.forEach((vector) => {
      it(`should handle XSS attempt: ${vector.substring(0, 30)}...`, () => {
        const errors = validateSearch(vector);
        // XSS strings are typically short, so they pass validation
        if (vector.length <= 100 && vector.trim().length > 0) {
          expect(errors).toEqual({});
        }
      });
    });
  });

  describe("Unicode handling", () => {
    it("should accept Chinese characters", () => {
      const errors = validateSearch("挖掘机");
      expect(errors).toEqual({});
    });

    it("should accept Arabic characters", () => {
      const errors = validateSearch("حفارة");
      expect(errors).toEqual({});
    });

    it("should accept emojis", () => {
      const errors = validateSearch("🚜 tractor 🚜");
      expect(errors).toEqual({});
    });

    it("should handle combining diacriticals", () => {
      const errors = validateSearch("café");
      expect(errors).toEqual({});
    });

    it("should handle zero-width characters (potential bypass)", () => {
      // Zero-width space surrounded by regular chars
      const errors = validateSearch("a\u200Bb");
      expect(errors).toEqual({});
    });
  });

  describe("edge cases", () => {
    it("should handle null input", () => {
      // @ts-expect-error - Testing runtime behavior
      expect(() => validateSearch(null)).toThrow();
    });

    it("should handle undefined input", () => {
      // @ts-expect-error - Testing runtime behavior
      expect(() => validateSearch(undefined)).toThrow();
    });

    it("should throw for number input (no trim method)", () => {
      // @ts-expect-error - Testing runtime behavior
      // Numbers don't have trim() method, so validation throws
      expect(() => validateSearch(123)).toThrow(TypeError);
    });

    it("should throw for object input (no trim method)", () => {
      // @ts-expect-error - Testing runtime behavior
      // Objects don't have trim() method, so validation throws
      expect(() => validateSearch({ toString: () => "test" })).toThrow(TypeError);
    });
  });
});

// ============================================================================
// validateCheckout Tests
// ============================================================================

describe("validateCheckout", () => {
  describe("valid inputs", () => {
    it("should accept valid checkout data", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        days: 5,
      });
      expect(errors).toEqual({});
    });

    it("should accept days of 1 (minimum valid)", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        days: 1,
      });
      expect(errors).toEqual({});
    });

    it("should accept large number of days", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        days: 365,
      });
      expect(errors).toEqual({});
    });

    it("should accept very large number of days", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        days: 999999,
      });
      expect(errors).toEqual({});
    });
  });

  describe("equipmentId validation", () => {
    it("should reject missing equipmentId", () => {
      const errors = validateCheckout({ days: 5 });
      expect(errors.equipmentId).toBe("Equipment is required");
    });

    it("should reject empty string equipmentId", () => {
      const errors = validateCheckout({
        equipmentId: "",
        days: 5,
      });
      expect(errors.equipmentId).toBe("Equipment is required");
    });

    it("should reject whitespace-only equipmentId", () => {
      const errors = validateCheckout({
        equipmentId: "   ",
        days: 5,
      });
      expect(errors.equipmentId).toBe("Equipment is required");
    });
  });

  describe("days validation", () => {
    it("should reject missing days", () => {
      const errors = validateCheckout({ equipmentId: "equip-123" });
      expect(errors.days).toBe("Rental days is required");
    });

    it("should reject null days", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        // @ts-expect-error - Testing runtime behavior
        days: null,
      });
      expect(errors.days).toBe("Rental days is required");
    });

    it("should reject zero days", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        days: 0,
      });
      expect(errors.days).toBe("Rental days must be a positive number");
    });

    it("should reject negative days", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        days: -5,
      });
      expect(errors.days).toBe("Rental days must be a positive number");
    });

    it("should reject NaN days", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        days: NaN,
      });
      expect(errors.days).toBe("Rental days must be a positive number");
    });

    it("should reject Infinity days", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        days: Infinity,
      });
      expect(errors.days).toBe("Rental days must be a positive number");
    });

    it("should reject decimal days (0.5)", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        days: 0.5,
      });
      // 0.5 passes isFinite and > 0 check, but fails isInteger check
      expect(errors.days).toBe("Rental days must be a whole number");
    });

    it("should reject decimal days (5.5)", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        days: 5.5,
      });
      expect(errors.days).toBe("Rental days must be a whole number");
    });

    it("should reject decimal days (1.1)", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        days: 1.1,
      });
      expect(errors.days).toBe("Rental days must be a whole number");
    });

    it("should handle string that looks like number (type coercion)", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        // @ts-expect-error - Testing runtime behavior
        days: "5",
      });
      // Number.isFinite("5") returns false
      expect(errors.days).toBe("Rental days must be a positive number");
    });

    it("should handle array type coercion attack", () => {
      const errors = validateCheckout({
        equipmentId: "equip-123",
        // @ts-expect-error - Testing type coercion
        days: [5],
      });
      expect(errors.days).toBeDefined();
    });
  });

  describe("multiple errors", () => {
    it("should return all errors at once", () => {
      const errors = validateCheckout({});
      expect(errors.equipmentId).toBe("Equipment is required");
      expect(errors.days).toBe("Rental days is required");
    });

    it("should return all errors with invalid values", () => {
      const errors = validateCheckout({
        equipmentId: "",
        days: -1,
      });
      expect(errors.equipmentId).toBe("Equipment is required");
      expect(errors.days).toBe("Rental days must be a positive number");
    });
  });
});

// ============================================================================
// hasErrors Tests
// ============================================================================

describe("hasErrors", () => {
  it("should return false for empty error object", () => {
    expect(hasErrors({})).toBe(false);
  });

  it("should return true for object with one error", () => {
    expect(hasErrors({ title: "Error" })).toBe(true);
  });

  it("should return true for object with multiple errors", () => {
    expect(hasErrors({ title: "Error1", description: "Error2" })).toBe(true);
  });

  it("should return false for object with only prototype properties", () => {
    const errors = Object.create({ inherited: "value" });
    expect(hasErrors(errors)).toBe(false);
  });

  it("should handle object created with null prototype", () => {
    const errors = Object.create(null);
    expect(hasErrors(errors)).toBe(false);
  });

  it("should return true for object with empty string value", () => {
    // Empty string is still a property
    expect(hasErrors({ title: "" })).toBe(true);
  });

  it("should return true for object with undefined value", () => {
    expect(hasErrors({ title: undefined as unknown as string })).toBe(true);
  });

  it("should handle array input (array is object)", () => {
    // @ts-expect-error - Testing runtime behavior
    expect(hasErrors([])).toBe(false);
    // @ts-expect-error - Testing runtime behavior
    expect(hasErrors([1, 2, 3])).toBe(true); // Arrays have numeric keys
  });
});

// ============================================================================
// formatValidationErrors Tests
// ============================================================================

describe("formatValidationErrors", () => {
  it("should format empty errors object", () => {
    const result = formatValidationErrors({});
    expect(result).toEqual({
      error: "Validation failed",
      errors: {},
    });
  });

  it("should format single error", () => {
    const result = formatValidationErrors({ title: "Title is required" });
    expect(result).toEqual({
      error: "Validation failed",
      errors: { title: "Title is required" },
    });
  });

  it("should format multiple errors", () => {
    const errors = {
      title: "Title is required",
      description: "Description is required",
      dailyRate: "Daily rate must be positive",
    };
    const result = formatValidationErrors(errors);
    expect(result).toEqual({
      error: "Validation failed",
      errors,
    });
  });

  it("should preserve original errors object reference", () => {
    const errors = { title: "Error" };
    const result = formatValidationErrors(errors);
    expect(result.errors).toBe(errors);
  });

  it("should handle errors with special characters", () => {
    const errors = { title: '<script>alert("XSS")</script>' };
    const result = formatValidationErrors(errors);
    expect(result.errors.title).toBe('<script>alert("XSS")</script>');
  });

  it("should handle errors with Unicode", () => {
    const errors = { title: "标题必须填写" };
    const result = formatValidationErrors(errors);
    expect(result.errors.title).toBe("标题必须填写");
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("validation integration", () => {
  it("should work in typical API validation flow", () => {
    const formData = {
      title: "",
      description: "Valid description",
      category: "Excavators",
      dailyRate: 10000,
    };

    const errors = validateEquipment(formData as EquipmentFormData);

    if (hasErrors(errors)) {
      const response = formatValidationErrors(errors);
      expect(response.error).toBe("Validation failed");
      expect(response.errors.title).toBe("Title is required");
    }
  });

  it("should validate equipment and then checkout in sequence", () => {
    const equipmentData: EquipmentFormData = {
      title: "Test Excavator",
      description: "A test excavator for rental",
      category: "Excavators",
      dailyRate: 25000,
    };

    const equipmentErrors = validateEquipment(equipmentData);
    expect(hasErrors(equipmentErrors)).toBe(false);

    // Simulate checkout for this equipment
    const checkoutErrors = validateCheckout({
      equipmentId: "equip-generated-id",
      days: 7,
    });
    expect(hasErrors(checkoutErrors)).toBe(false);
  });

  it("should handle rapid sequential validations", () => {
    for (let i = 0; i < 1000; i++) {
      const errors = validateSearch(`search query ${i}`);
      expect(hasErrors(errors)).toBe(false);
    }
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe("validation performance", () => {
  it("should validate equipment in reasonable time", () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      validateEquipment(validEquipmentData);
    }
    const duration = performance.now() - start;
    // Should complete 10000 validations in under 1 second
    expect(duration).toBeLessThan(1000);
  });

  it("should handle very long strings without hanging", () => {
    const longString = "a".repeat(100000);
    const start = performance.now();
    validateEquipment(createEquipmentData({ description: longString }));
    const duration = performance.now() - start;
    // Should complete in under 100ms even with huge string
    expect(duration).toBeLessThan(100);
  });

  it("should throw for deeply nested object as title (no trim method)", () => {
    // This tests that validation throws when title is not a string
    const deepObject: Record<string, unknown> = {};
    let current = deepObject;
    for (let i = 0; i < 1000; i++) {
      current.nested = {};
      current = current.nested as Record<string, unknown>;
    }

    // @ts-expect-error - Testing runtime behavior
    // Objects don't have trim() method, so validation throws
    expect(() => validateEquipment({ title: deepObject })).toThrow(TypeError);
  });
});
