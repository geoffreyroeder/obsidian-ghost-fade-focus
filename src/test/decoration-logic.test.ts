/**
 * Tests for the decoration logic that ignores empty lines
 */

import { describe, expect, test } from '@jest/globals';
import { 
  createFadedLineDecorations
} from '../decorations';

import {
  calculateEffectiveDistances,
  isEmptyLine
} from '../document-analysis';

// Implementation that directly mirrors the actual algorithm in main.ts
function calculateEffectiveDistance(lines: string[], cursorLine: number): Map<number, number> {
  const nonEmptyLines = new Map<number, number>();
  let effectiveDistanceUp = 0;
  let effectiveDistanceDown = 0;
  
  // Process lines from top to bottom, exactly as done in the plugin
  for (let i = 0; i < lines.length; i++) {
    const isEmpty = isEmptyLine(lines[i]);
    
    if (!isEmpty) {
      if (i < cursorLine) {
        // For lines above cursor: closest line to cursor gets 0, next gets 1, etc.
        nonEmptyLines.set(i, effectiveDistanceUp);
        effectiveDistanceUp++;
      } else if (i > cursorLine) {
        // For lines below cursor: closest line to cursor gets 1, next gets 2, etc.
        effectiveDistanceDown++;
        nonEmptyLines.set(i, effectiveDistanceDown);
      } else {
        // Cursor line always gets 0
        nonEmptyLines.set(i, 0);
      }
    }
  }
  
  return nonEmptyLines;
}

describe('Decoration Logic', () => {
  describe('calculateEffectiveDistance', () => {
    test('handles document with no empty lines', () => {
      const lines = [
        'Line 1',
        'Line 2',
        'Line 3',
        'Line 4',
        'Line 5'
      ];
      const cursorLine = 2; // Line 3
      
      const result = calculateEffectiveDistance(lines, cursorLine);
      
      // Expected distances based on actual implementation:
      // Line 1: 0 (first non-empty line above cursor)
      // Line 2: 1 (second non-empty line above cursor)
      // Line 3: 0 (cursor line)
      // Line 4: 1 (first non-empty line below cursor)
      // Line 5: 2 (second non-empty line below cursor)
      expect(result.get(0)).toBe(0);
      expect(result.get(1)).toBe(1);
      expect(result.get(2)).toBe(0);
      expect(result.get(3)).toBe(1);
      expect(result.get(4)).toBe(2);
    });
    
    test('ignores empty lines when calculating distance', () => {
      const lines = [
        'Line 1',
        '',           // Empty line
        'Line 3',
        '',           // Empty line
        '',           // Empty line
        'Line 6',
        '',           // Empty line
        'Line 8'
      ];
      const cursorLine = 2; // Line 3
      
      const result = calculateEffectiveDistance(lines, cursorLine);
      
      // Expected distances based on actual implementation:
      // Line 1: 0 (first non-empty line above cursor)
      // Line 3: 0 (cursor line)
      // Line 6: 1 (first non-empty line below cursor)
      // Line 8: 2 (second non-empty line below cursor)
      expect(result.get(0)).toBe(0);
      expect(result.get(2)).toBe(0);
      expect(result.get(5)).toBe(1);
      expect(result.get(7)).toBe(2);
      
      // Empty lines should not be in the map
      expect(result.has(1)).toBe(false);
      expect(result.has(3)).toBe(false);
      expect(result.has(4)).toBe(false);
      expect(result.has(6)).toBe(false);
    });
    
    test('handles cursor on first line', () => {
      const lines = [
        'Line 1',     // Cursor here
        '',           // Empty line
        'Line 3',
        '',           // Empty line
        'Line 5'
      ];
      const cursorLine = 0; // Line 1
      
      const result = calculateEffectiveDistance(lines, cursorLine);
      
      // Expected distances based on actual implementation:
      // Line 1: 0 (cursor line)
      // Line 3: 1 (first non-empty line below cursor)
      // Line 5: 2 (second non-empty line below cursor)
      expect(result.get(0)).toBe(0);
      expect(result.get(2)).toBe(1);
      expect(result.get(4)).toBe(2);
    });
    
    test('handles cursor on last line', () => {
      const lines = [
        'Line 1',
        '',           // Empty line
        'Line 3',
        '',           // Empty line
        'Line 5'      // Cursor here
      ];
      const cursorLine = 4; // Line 5
      
      const result = calculateEffectiveDistance(lines, cursorLine);
      
      // Expected distances based on actual implementation:
      // Line 1: 0 (first non-empty line above cursor)
      // Line 3: 1 (second non-empty line above cursor)
      // Line 5: 0 (cursor line)
      expect(result.get(0)).toBe(0);
      expect(result.get(2)).toBe(1);
      expect(result.get(4)).toBe(0);
    });
    
    test('handles document with only empty lines', () => {
      const lines = [
        '',
        '',
        '',
        ''
      ];
      const cursorLine = 2;
      
      const result = calculateEffectiveDistance(lines, cursorLine);
      
      // No non-empty lines, so map should be empty
      expect(result.size).toBe(0);
    });
    
    test('handles document with only one non-empty line (cursor line)', () => {
      const lines = [
        '',
        '',
        'Line 3',     // Cursor here
        '',
        ''
      ];
      const cursorLine = 2;
      
      const result = calculateEffectiveDistance(lines, cursorLine);
      
      // Only cursor line should be in the map
      expect(result.size).toBe(1);
      expect(result.get(2)).toBe(0);
    });
  });
}); 