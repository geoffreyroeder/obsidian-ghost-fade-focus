import { isEmptyLine } from "../utils";

// Mock any dependencies if needed
jest.mock("obsidian");

describe("Ghost Fade Focus Utility Functions", () => {
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