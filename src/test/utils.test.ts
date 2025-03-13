// Test file for utilities functionality
import { describe, expect, test } from '@jest/globals';
import { isEmptyLine } from '../document-analysis';  // Updated import

// Define the function directly to avoid importing from main.ts


describe("Utility Functions", () => {
  describe("isEmptyLine", () => {
    test("returns true for empty string", () => {
      expect(isEmptyLine("")).toBe(true);
    });
    
    test("returns true for whitespace only", () => {
      expect(isEmptyLine("   ")).toBe(true);
      expect(isEmptyLine("\t")).toBe(true);
      expect(isEmptyLine(" \t ")).toBe(true);
    });
    
    test("returns false for non-empty lines", () => {
      expect(isEmptyLine("a")).toBe(false);
      expect(isEmptyLine(" a ")).toBe(false);
      expect(isEmptyLine("# Heading")).toBe(false);
    });
  });
}); 