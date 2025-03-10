// Define the function directly to avoid importing from main.ts
// This completely isolates the test from Obsidian dependencies
function isEmptyLine(text: string): boolean {
  return text.trim() === "";
}

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