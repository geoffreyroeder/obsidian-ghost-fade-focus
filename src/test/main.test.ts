import { describe, expect, test } from '@jest/globals';
import GhostFocusPlugin from '../main';
import { DEFAULT_SETTINGS } from '../settings';

// You may need to import other functionality from the new modules
// depending on what this test is specifically testing
import { isEmptyLine } from '../document-analysis';
import { applyCSSVariables } from '../dom-utils';

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