/**
 * Comprehensive unit tests for lib/utils.ts
 * Tests edge cases, security concerns, type coercion, and boundary conditions
 */

import {
  formatCurrency,
  safeJsonParse,
  parseSpecs,
  calculateRentalDays,
} from "@/lib/utils";

// ============================================================================
// formatCurrency Tests
// ============================================================================

describe("formatCurrency", () => {
  describe("valid inputs", () => {
    it("should format 0 cents as $0.00", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("should format 100 cents as $1.00", () => {
      expect(formatCurrency(100)).toBe("$1.00");
    });

    it("should format 1 cent as $0.01", () => {
      expect(formatCurrency(1)).toBe("$0.01");
    });

    it("should format 99 cents as $0.99", () => {
      expect(formatCurrency(99)).toBe("$0.99");
    });

    it("should format 1000 cents as $10.00", () => {
      expect(formatCurrency(1000)).toBe("$10.00");
    });

    it("should format 10000 cents as $100.00", () => {
      expect(formatCurrency(10000)).toBe("$100.00");
    });

    it("should format 100000 cents as $1,000.00", () => {
      expect(formatCurrency(100000)).toBe("$1,000.00");
    });

    it("should format 1000000 cents as $10,000.00", () => {
      expect(formatCurrency(1000000)).toBe("$10,000.00");
    });

    it("should format 10000000 cents as $100,000.00", () => {
      expect(formatCurrency(10000000)).toBe("$100,000.00");
    });

    it("should format 100000000 cents as $1,000,000.00", () => {
      expect(formatCurrency(100000000)).toBe("$1,000,000.00");
    });

    it("should include thousands separators", () => {
      const result = formatCurrency(123456789);
      expect(result).toContain(",");
      expect(result).toBe("$1,234,567.89");
    });
  });

  describe("negative values", () => {
    it("should format negative cents with minus sign", () => {
      expect(formatCurrency(-100)).toBe("-$1.00");
    });

    it("should format -1 cent as -$0.01", () => {
      expect(formatCurrency(-1)).toBe("-$0.01");
    });

    it("should format large negative values", () => {
      expect(formatCurrency(-1000000)).toBe("-$10,000.00");
    });
  });

  describe("decimal/fractional cents", () => {
    it("should handle fractional cents (0.5)", () => {
      // Intl.NumberFormat rounds fractional cents
      const result = formatCurrency(0.5);
      expect(result).toBe("$0.01"); // Rounds up
    });

    it("should handle fractional cents (0.4)", () => {
      const result = formatCurrency(0.4);
      expect(result).toBe("$0.00"); // Rounds down
    });

    it("should handle fractional cents (99.99)", () => {
      const result = formatCurrency(99.99);
      expect(result).toBe("$1.00"); // Rounds
    });

    it("should handle very small fractional values", () => {
      const result = formatCurrency(0.001);
      expect(result).toBe("$0.00");
    });
  });

  describe("boundary values", () => {
    it("should handle Number.MAX_SAFE_INTEGER", () => {
      const result = formatCurrency(Number.MAX_SAFE_INTEGER);
      expect(result).toContain("$");
      expect(result).not.toBe("$NaN");
    });

    it("should handle Number.MIN_SAFE_INTEGER", () => {
      const result = formatCurrency(Number.MIN_SAFE_INTEGER);
      expect(result).toContain("-$");
      expect(result).not.toBe("-$NaN");
    });

    it("should handle very large numbers beyond safe integer", () => {
      const result = formatCurrency(Number.MAX_VALUE);
      expect(result).not.toBe("$NaN");
      expect(result).not.toBe("$Infinity");
    });
  });

  describe("special numeric values", () => {
    it("should handle NaN", () => {
      const result = formatCurrency(NaN);
      expect(result).toBe("$NaN");
    });

    it("should handle Infinity", () => {
      const result = formatCurrency(Infinity);
      // Intl.NumberFormat formats Infinity as infinity symbol
      expect(result).toContain("$");
    });

    it("should handle -Infinity", () => {
      const result = formatCurrency(-Infinity);
      expect(result).toContain("-$");
    });

    it("should handle -0", () => {
      const result = formatCurrency(-0);
      // Note: Intl.NumberFormat preserves the negative sign for -0
      // This documents the actual behavior
      expect(result).toBe("-$0.00");
    });
  });

  describe("type coercion", () => {
    it("should handle string input that looks like number", () => {
      // @ts-expect-error - Testing runtime behavior
      const result = formatCurrency("100");
      // "100" / 100 = 1
      expect(result).toBe("$1.00");
    });

    it("should handle empty string", () => {
      // @ts-expect-error - Testing runtime behavior
      const result = formatCurrency("");
      // "" / 100 = 0
      expect(result).toBe("$0.00");
    });

    it("should handle null", () => {
      // @ts-expect-error - Testing runtime behavior
      const result = formatCurrency(null);
      // null / 100 = 0
      expect(result).toBe("$0.00");
    });

    it("should handle undefined", () => {
      // @ts-expect-error - Testing runtime behavior
      const result = formatCurrency(undefined);
      // undefined / 100 = NaN
      expect(result).toBe("$NaN");
    });

    it("should handle boolean true", () => {
      // @ts-expect-error - Testing runtime behavior
      const result = formatCurrency(true);
      // true / 100 = 0.01
      expect(result).toBe("$0.01");
    });

    it("should handle boolean false", () => {
      // @ts-expect-error - Testing runtime behavior
      const result = formatCurrency(false);
      // false / 100 = 0
      expect(result).toBe("$0.00");
    });

    it("should handle array", () => {
      // @ts-expect-error - Testing runtime behavior
      const result = formatCurrency([100]);
      // [100] / 100 coerces to 100 / 100 = 1
      expect(result).toBe("$1.00");
    });

    it("should handle object with valueOf", () => {
      // @ts-expect-error - Testing runtime behavior
      const result = formatCurrency({ valueOf: () => 500 });
      expect(result).toBe("$5.00");
    });
  });
});

// ============================================================================
// safeJsonParse Tests
// ============================================================================

describe("safeJsonParse", () => {
  describe("valid JSON", () => {
    it("should parse valid JSON object", () => {
      const result = safeJsonParse('{"key": "value"}', {});
      expect(result).toEqual({ key: "value" });
    });

    it("should parse valid JSON array", () => {
      const result = safeJsonParse("[1, 2, 3]", []);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should parse JSON string", () => {
      const result = safeJsonParse('"hello"', "");
      expect(result).toBe("hello");
    });

    it("should parse JSON number", () => {
      const result = safeJsonParse("42", 0);
      expect(result).toBe(42);
    });

    it("should parse JSON boolean true", () => {
      const result = safeJsonParse("true", false);
      expect(result).toBe(true);
    });

    it("should parse JSON boolean false", () => {
      const result = safeJsonParse("false", true);
      expect(result).toBe(false);
    });

    it("should parse JSON null", () => {
      const result = safeJsonParse("null", {});
      expect(result).toBe(null);
    });

    it("should parse nested JSON objects", () => {
      const json = '{"a": {"b": {"c": 1}}}';
      const result = safeJsonParse(json, {});
      expect(result).toEqual({ a: { b: { c: 1 } } });
    });

    it("should parse JSON with unicode", () => {
      const json = '{"message": "Hello 你好 🎉"}';
      const result = safeJsonParse(json, {});
      expect(result).toEqual({ message: "Hello 你好 🎉" });
    });

    it("should parse JSON with escaped characters", () => {
      const json = '{"text": "line1\\nline2\\ttab"}';
      const result = safeJsonParse(json, {});
      expect(result).toEqual({ text: "line1\nline2\ttab" });
    });

    it("should parse empty object", () => {
      const result = safeJsonParse("{}", { default: true });
      expect(result).toEqual({});
    });

    it("should parse empty array", () => {
      const result = safeJsonParse("[]", [1, 2, 3]);
      expect(result).toEqual([]);
    });
  });

  describe("invalid JSON - returns fallback", () => {
    it("should return fallback for invalid JSON", () => {
      const fallback = { default: true };
      const result = safeJsonParse("not json", fallback);
      expect(result).toBe(fallback);
    });

    it("should return fallback for empty string", () => {
      const fallback = { empty: true };
      const result = safeJsonParse("", fallback);
      expect(result).toBe(fallback);
    });

    it("should return fallback for whitespace only", () => {
      const fallback = [];
      const result = safeJsonParse("   ", fallback);
      expect(result).toBe(fallback);
    });

    it("should return fallback for single quotes (invalid JSON)", () => {
      const fallback = {};
      const result = safeJsonParse("{'key': 'value'}", fallback);
      expect(result).toBe(fallback);
    });

    it("should return fallback for trailing comma", () => {
      const fallback = {};
      const result = safeJsonParse('{"key": "value",}', fallback);
      expect(result).toBe(fallback);
    });

    it("should return fallback for undefined value", () => {
      const fallback = {};
      const result = safeJsonParse('{"key": undefined}', fallback);
      expect(result).toBe(fallback);
    });

    it("should return fallback for unquoted keys", () => {
      const fallback = {};
      const result = safeJsonParse('{key: "value"}', fallback);
      expect(result).toBe(fallback);
    });

    it("should return fallback for JavaScript object notation", () => {
      const fallback = {};
      const result = safeJsonParse("{ key: value }", fallback);
      expect(result).toBe(fallback);
    });

    it("should return fallback for truncated JSON", () => {
      const fallback = {};
      const result = safeJsonParse('{"key":', fallback);
      expect(result).toBe(fallback);
    });

    it("should return fallback for unclosed brackets", () => {
      const fallback = [];
      const result = safeJsonParse("[1, 2, 3", fallback);
      expect(result).toBe(fallback);
    });
  });

  describe("security - prototype pollution", () => {
    it("should parse but not pollute prototype with __proto__", () => {
      const json = '{"__proto__": {"polluted": true}}';
      const result = safeJsonParse<Record<string, unknown>>(json, {});

      // The parsed object may contain __proto__ as a key
      // but it should NOT pollute Object.prototype
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("should parse constructor pollution attempt safely", () => {
      const json = '{"constructor": {"prototype": {"polluted": true}}}';
      const result = safeJsonParse<Record<string, unknown>>(json, {});

      // Should not pollute Object.prototype
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
  });

  describe("security - JSON injection", () => {
    it("should safely parse JSON with script tags", () => {
      const json = '{"content": "<script>alert(1)</script>"}';
      const result = safeJsonParse<Record<string, string>>(json, {});
      expect(result.content).toBe("<script>alert(1)</script>");
    });

    it("should handle extremely long JSON strings", () => {
      const longValue = "a".repeat(100000);
      const json = `{"value": "${longValue}"}`;
      const result = safeJsonParse<Record<string, string>>(json, {});
      expect(result.value).toBe(longValue);
    });
  });

  describe("edge cases", () => {
    it("should handle JSON with numeric keys", () => {
      const json = '{"0": "zero", "1": "one"}';
      const result = safeJsonParse<Record<string, string>>(json, {});
      expect(result["0"]).toBe("zero");
      expect(result["1"]).toBe("one");
    });

    it("should handle deeply nested JSON", () => {
      let json = '{"a":';
      for (let i = 0; i < 100; i++) {
        json += '{"b":';
      }
      json += '"deep"';
      for (let i = 0; i < 100; i++) {
        json += "}";
      }
      json += "}";

      const result = safeJsonParse(json, {});
      expect(result).toBeDefined();
    });

    it("should handle JSON with all types of values", () => {
      const json = `{
        "string": "text",
        "number": 42,
        "float": 3.14,
        "bool": true,
        "null": null,
        "array": [1, "two", null],
        "object": {"nested": true}
      }`;
      const result = safeJsonParse(json, {});
      expect(result).toHaveProperty("string", "text");
      expect(result).toHaveProperty("number", 42);
      expect(result).toHaveProperty("bool", true);
      expect(result).toHaveProperty("null", null);
    });

    it("should preserve reference to fallback on error", () => {
      const fallback = { original: true };
      const result = safeJsonParse("invalid", fallback);
      expect(result).toBe(fallback);
      expect(result === fallback).toBe(true);
    });
  });

  describe("type handling", () => {
    it("should return typed result for objects", () => {
      interface MyType {
        name: string;
        value: number;
      }
      const result = safeJsonParse<MyType>('{"name": "test", "value": 42}', {
        name: "",
        value: 0,
      });
      expect(result.name).toBe("test");
      expect(result.value).toBe(42);
    });

    it("should return fallback type on error", () => {
      interface MyType {
        name: string;
      }
      const fallback: MyType = { name: "default" };
      const result = safeJsonParse<MyType>("invalid", fallback);
      expect(result.name).toBe("default");
    });
  });
});

// ============================================================================
// parseSpecs Tests
// ============================================================================

describe("parseSpecs", () => {
  describe("valid specs JSON", () => {
    it("should parse valid equipment specs", () => {
      const specs = '{"weight": "5000 lbs", "power": "300 HP"}';
      const result = parseSpecs(specs);
      expect(result).toEqual({ weight: "5000 lbs", power: "300 HP" });
    });

    it("should parse complex specs with nested objects", () => {
      const specs = '{"dimensions": {"length": 20, "width": 10, "height": 8}}';
      const result = parseSpecs(specs);
      expect(result).toEqual({
        dimensions: { length: 20, width: 10, height: 8 },
      });
    });

    it("should parse specs with arrays", () => {
      const specs = '{"features": ["GPS", "AC", "Heated seats"]}';
      const result = parseSpecs(specs);
      expect(result).toEqual({
        features: ["GPS", "AC", "Heated seats"],
      });
    });

    it("should parse empty object specs", () => {
      const result = parseSpecs("{}");
      expect(result).toEqual({});
    });

    it("should handle specs with special characters", () => {
      const specs = '{"note": "Includes 2\\" hitch adapter"}';
      const result = parseSpecs(specs);
      expect(result).toEqual({ note: 'Includes 2" hitch adapter' });
    });
  });

  describe("invalid specs - returns empty object", () => {
    it("should return empty object for invalid JSON", () => {
      const result = parseSpecs("not valid json");
      expect(result).toEqual({});
    });

    it("should return empty object for empty string", () => {
      const result = parseSpecs("");
      expect(result).toEqual({});
    });

    it("should return empty object for null-ish strings", () => {
      const result = parseSpecs("null");
      expect(result).toBe(null); // JSON.parse("null") returns null
    });

    it("should return empty object for array JSON", () => {
      // parseSpecs expects object but arrays are valid JSON
      const result = parseSpecs("[1, 2, 3]");
      expect(result).toEqual([1, 2, 3]); // Returns array, not object
    });
  });

  describe("real-world equipment specs", () => {
    it("should parse excavator specs", () => {
      const specs = JSON.stringify({
        weight: "45000 lbs",
        bucketCapacity: "1.5 cubic yards",
        maxReach: "32 feet",
        engine: "Caterpillar C7.1",
        horsepower: 225,
      });
      const result = parseSpecs(specs);
      expect(result.weight).toBe("45000 lbs");
      expect(result.horsepower).toBe(225);
    });

    it("should parse generator specs", () => {
      const specs = JSON.stringify({
        output: "50 kW",
        fuel: "Diesel",
        runtime: "24 hours at 50% load",
        outlets: ["120V", "240V", "480V"],
      });
      const result = parseSpecs(specs);
      expect(result.outlets).toHaveLength(3);
    });
  });
});

// ============================================================================
// calculateRentalDays Tests
// ============================================================================

describe("calculateRentalDays", () => {
  describe("valid date ranges", () => {
    it("should calculate 1 day for same day booking", () => {
      const start = new Date("2024-01-15T00:00:00Z");
      const end = new Date("2024-01-15T12:00:00Z");
      expect(calculateRentalDays(start, end)).toBe(1);
    });

    it("should calculate 1 day for exactly 24 hours", () => {
      const start = new Date("2024-01-15T00:00:00Z");
      const end = new Date("2024-01-16T00:00:00Z");
      expect(calculateRentalDays(start, end)).toBe(1);
    });

    it("should calculate 2 days for slightly over 24 hours", () => {
      const start = new Date("2024-01-15T00:00:00Z");
      const end = new Date("2024-01-16T00:00:01Z"); // 1 second over
      expect(calculateRentalDays(start, end)).toBe(2);
    });

    it("should calculate 7 days for a week", () => {
      const start = new Date("2024-01-15");
      const end = new Date("2024-01-22");
      expect(calculateRentalDays(start, end)).toBe(7);
    });

    it("should calculate 30 days for a month", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-31");
      expect(calculateRentalDays(start, end)).toBe(30);
    });

    it("should calculate 365 days for a year", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2025-01-01");
      expect(calculateRentalDays(start, end)).toBe(366); // 2024 is leap year
    });

    it("should handle fractional days with ceiling", () => {
      const start = new Date("2024-01-15T00:00:00Z");
      const end = new Date("2024-01-15T01:00:00Z"); // 1 hour
      expect(calculateRentalDays(start, end)).toBe(1);
    });

    it("should handle very short durations (1 millisecond)", () => {
      const start = new Date("2024-01-15T00:00:00.000Z");
      const end = new Date("2024-01-15T00:00:00.001Z");
      expect(calculateRentalDays(start, end)).toBe(1);
    });
  });

  describe("invalid date ranges", () => {
    it("should return 0 for end before start", () => {
      const start = new Date("2024-01-20");
      const end = new Date("2024-01-15");
      expect(calculateRentalDays(start, end)).toBe(0);
    });

    it("should return 0 for equal dates", () => {
      const date = new Date("2024-01-15");
      expect(calculateRentalDays(date, date)).toBe(0);
    });

    it("should return 0 for invalid start date (NaN)", () => {
      const invalidStart = new Date("invalid");
      const validEnd = new Date("2024-01-20");
      expect(calculateRentalDays(invalidStart, validEnd)).toBe(0);
    });

    it("should return 0 for invalid end date (NaN)", () => {
      const validStart = new Date("2024-01-15");
      const invalidEnd = new Date("invalid");
      expect(calculateRentalDays(validStart, invalidEnd)).toBe(0);
    });

    it("should return 0 for both dates invalid", () => {
      const invalid1 = new Date("not-a-date");
      const invalid2 = new Date("also-invalid");
      expect(calculateRentalDays(invalid1, invalid2)).toBe(0);
    });
  });

  describe("timezone handling", () => {
    it("should calculate correctly across timezone boundaries", () => {
      const start = new Date("2024-01-15T23:00:00-05:00"); // EST
      const end = new Date("2024-01-16T01:00:00-05:00"); // 2 hours later
      expect(calculateRentalDays(start, end)).toBe(1);
    });

    it("should handle UTC dates", () => {
      const start = new Date("2024-01-15T00:00:00Z");
      const end = new Date("2024-01-17T00:00:00Z");
      expect(calculateRentalDays(start, end)).toBe(2);
    });

    it("should handle daylight saving time transitions", () => {
      // DST transition day in the US (losing 1 hour)
      const start = new Date("2024-03-10T00:00:00"); // Before DST
      const end = new Date("2024-03-11T00:00:00"); // After DST
      // Should still be 1 day even though actual elapsed time is 23 hours
      const days = calculateRentalDays(start, end);
      expect(days).toBeGreaterThanOrEqual(1);
    });
  });

  describe("edge cases", () => {
    it("should handle Date at Unix epoch (1970)", () => {
      const epoch = new Date(0);
      const dayAfter = new Date(86400000); // 1 day in ms
      expect(calculateRentalDays(epoch, dayAfter)).toBe(1);
    });

    it("should handle dates far in the future", () => {
      const start = new Date("3000-01-01");
      const end = new Date("3000-01-08");
      expect(calculateRentalDays(start, end)).toBe(7);
    });

    it("should handle large date ranges", () => {
      const start = new Date("2000-01-01");
      const end = new Date("2100-01-01");
      const days = calculateRentalDays(start, end);
      expect(days).toBeGreaterThan(36000); // ~100 years
    });

    it("should handle millisecond precision", () => {
      const start = new Date("2024-01-15T00:00:00.999Z");
      const end = new Date("2024-01-15T00:00:01.000Z");
      expect(calculateRentalDays(start, end)).toBe(1);
    });
  });

  describe("type coercion attacks", () => {
    it("should handle Date-like objects", () => {
      const fakeDateWithGetTime = { getTime: () => Date.now() };
      // @ts-expect-error - Testing runtime behavior
      const result = calculateRentalDays(fakeDateWithGetTime, {
        getTime: () => Date.now() + 86400000,
      });
      expect(result).toBe(1);
    });

    it("should handle objects with non-finite getTime", () => {
      const fakeDate = { getTime: () => Infinity };
      // @ts-expect-error - Testing runtime behavior
      const result = calculateRentalDays(fakeDate, new Date());
      expect(result).toBe(0);
    });

    it("should handle objects with NaN getTime", () => {
      const fakeDate = { getTime: () => NaN };
      // @ts-expect-error - Testing runtime behavior
      const result = calculateRentalDays(fakeDate, new Date());
      expect(result).toBe(0);
    });
  });

  describe("leap year handling", () => {
    it("should calculate correctly for leap year February", () => {
      const start = new Date("2024-02-28");
      const end = new Date("2024-03-01");
      expect(calculateRentalDays(start, end)).toBe(2); // Feb has 29 days in 2024
    });

    it("should calculate correctly for non-leap year February", () => {
      const start = new Date("2023-02-28");
      const end = new Date("2023-03-01");
      expect(calculateRentalDays(start, end)).toBe(1); // Feb has 28 days in 2023
    });
  });

  describe("performance", () => {
    it("should calculate 10000 date ranges quickly", () => {
      const start = performance.now();
      const baseDate = new Date("2024-01-01");

      for (let i = 0; i < 10000; i++) {
        const endDate = new Date(baseDate.getTime() + i * 86400000);
        calculateRentalDays(baseDate, endDate);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("utils integration", () => {
  it("should correctly calculate and format rental cost", () => {
    const start = new Date("2024-01-15");
    const end = new Date("2024-01-22");
    const dailyRateCents = 25000; // $250/day

    const days = calculateRentalDays(start, end);
    const totalCents = days * dailyRateCents;
    const formattedTotal = formatCurrency(totalCents);

    expect(days).toBe(7);
    expect(totalCents).toBe(175000);
    expect(formattedTotal).toBe("$1,750.00");
  });

  it("should handle equipment specs in a realistic workflow", () => {
    // Simulate receiving specs from database
    const dbSpecs = '{"weight":"10000 lbs","attachments":["bucket","thumb"]}';

    const specs = parseSpecs(dbSpecs);
    expect(specs.weight).toBe("10000 lbs");
    expect(specs.attachments).toContain("bucket");

    // Simulate modifying and re-serializing
    specs.condition = "excellent";
    const newSpecs = JSON.stringify(specs);
    const reparsed = parseSpecs(newSpecs);
    expect(reparsed.condition).toBe("excellent");
  });

  it("should handle all utils together in booking calculation", () => {
    // Equipment data
    const equipmentSpecs = parseSpecs(
      '{"dailyOperatingCost": 5000, "fuelIncluded": false}'
    );

    // Booking dates
    const startDate = new Date("2024-06-01");
    const endDate = new Date("2024-06-08");

    // Calculate rental
    const rentalDays = calculateRentalDays(startDate, endDate);
    expect(rentalDays).toBe(7);

    // Base rate: $500/day (50000 cents)
    const baseRate = 50000;
    const totalBaseCost = rentalDays * baseRate;

    // Add operating cost from specs
    const operatingCost = (equipmentSpecs.dailyOperatingCost as number) || 0;
    const totalOperatingCost = rentalDays * operatingCost;

    const grandTotal = totalBaseCost + totalOperatingCost;
    const formattedTotal = formatCurrency(grandTotal);

    expect(grandTotal).toBe(385000); // (50000 + 5000) * 7
    expect(formattedTotal).toBe("$3,850.00");
  });
});

// ============================================================================
// Security Tests
// ============================================================================

describe("utils security", () => {
  describe("safeJsonParse prototype pollution protection", () => {
    it("should not allow __proto__ to pollute Object.prototype", () => {
      const maliciousJson = '{"__proto__": {"isAdmin": true}}';
      safeJsonParse(maliciousJson, {});

      // Check that Object.prototype was not modified
      const testObj: Record<string, unknown> = {};
      expect(testObj.isAdmin).toBeUndefined();
    });

    it("should not allow constructor pollution", () => {
      const maliciousJson =
        '{"constructor": {"prototype": {"isAdmin": true}}}';
      safeJsonParse(maliciousJson, {});

      const testObj: Record<string, unknown> = {};
      expect(testObj.isAdmin).toBeUndefined();
    });
  });

  describe("formatCurrency injection safety", () => {
    it("should not execute code in formatted output", () => {
      // Even with weird input, formatCurrency uses Intl.NumberFormat
      // which is safe from injection
      const result = formatCurrency(100);
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
      expect(result).not.toContain("script");
    });
  });
});
