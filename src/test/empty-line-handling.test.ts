/**
 * Tests for empty line handling in decoration logic
 */

import { isEmptyLine, calculateEffectiveDistances } from '../utils';

describe('Empty Line Handling', () => {
  describe('calculateEffectiveDistances', () => {
    test('should correctly calculate distances with mixed empty and non-empty lines', () => {
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
      const cursorLineIndex = 2; // Line 3
      
      const result = calculateEffectiveDistances(lines, cursorLineIndex);
      
      // Expected:
      // Line 1 (index 0): distance 1 (first non-empty line above cursor)
      // Line 3 (index 2): distance 0 (cursor line)
      // Line 6 (index 5): distance 1 (first non-empty line below cursor)
      // Line 8 (index 7): distance 2 (second non-empty line below cursor)
      expect(result.size).toBe(4); // Only 4 non-empty lines should get distances
      
      expect(result.get(0)).toBe(1);
      expect(result.get(2)).toBe(0);
      expect(result.get(5)).toBe(1);
      expect(result.get(7)).toBe(2);
      
      // Empty lines should not be in the map
      expect(result.has(1)).toBe(false);
      expect(result.has(3)).toBe(false);
      expect(result.has(4)).toBe(false);
      expect(result.has(6)).toBe(false);
    });
    
    test('should handle consecutive empty lines correctly', () => {
      const lines = [
        'Line 1',
        '',           // Empty line
        '',           // Empty line
        '',           // Empty line
        'Line 5',     // Cursor here
        '',           // Empty line
        '',           // Empty line
        'Line 8'
      ];
      const cursorLineIndex = 4; // Line 5
      
      const result = calculateEffectiveDistances(lines, cursorLineIndex);
      
      // Expected:
      // Line 1 (index 0): distance 1 (first non-empty line above cursor)
      // Line 5 (index 4): distance 0 (cursor line)
      // Line 8 (index 7): distance 1 (first non-empty line below cursor)
      expect(result.size).toBe(3); // Only 3 non-empty lines should get distances
      
      expect(result.get(0)).toBe(1);
      expect(result.get(4)).toBe(0);
      expect(result.get(7)).toBe(1);
    });
    
    test('should handle cursor on empty line correctly', () => {
      const lines = [
        'Line 1',
        '',           // Empty line
        '',           // Cursor here (empty line)
        'Line 4',
        'Line 5'
      ];
      const cursorLineIndex = 2; // Empty line
      
      const result = calculateEffectiveDistances(lines, cursorLineIndex);
      
      // Expected:
      // Line 1 (index 0): distance 1 (first non-empty line above cursor)
      // Line 4 (index 3): distance 1 (first non-empty line below cursor)
      // Line 5 (index 4): distance 2 (second non-empty line below cursor)
      expect(result.size).toBe(3); // Only 3 non-empty lines should get distances
      
      expect(result.get(0)).toBe(1);
      expect(result.get(3)).toBe(1);
      expect(result.get(4)).toBe(2);
    });
    
    test('should handle document with only empty lines', () => {
      const lines = [
        '',
        '',
        '',           // Cursor here
        ''
      ];
      const cursorLineIndex = 2;
      
      const result = calculateEffectiveDistances(lines, cursorLineIndex);
      
      // Expected: No distances since all lines are empty
      expect(result.size).toBe(0);
    });
    
    test('should handle document with empty lines at boundaries', () => {
      const lines = [
        '',           // Empty line at start
        'Line 2',
        'Line 3',     // Cursor here
        'Line 4',
        '',           // Empty line at end
      ];
      const cursorLineIndex = 2; // Line 3
      
      const result = calculateEffectiveDistances(lines, cursorLineIndex);
      
      // Expected:
      // Line 2 (index 1): distance 1 (first non-empty line above cursor)
      // Line 3 (index 2): distance 0 (cursor line)
      // Line 4 (index 3): distance 1 (first non-empty line below cursor)
      expect(result.size).toBe(3);
      
      expect(result.get(1)).toBe(1);
      expect(result.get(2)).toBe(0);
      expect(result.get(3)).toBe(1);
    });
    
    test('should handle multiple non-empty lines above cursor', () => {
      const lines = [
        'Line 1',
        'Line 2',
        'Line 3',
        '',           // Empty line
        'Line 5',     // Cursor here
        'Line 6'
      ];
      const cursorLineIndex = 4; // Line 5
      
      const result = calculateEffectiveDistances(lines, cursorLineIndex);
      
      // Expected:
      // Line 1 (index 0): distance 3 (third non-empty line above cursor)
      // Line 2 (index 1): distance 2 (second non-empty line above cursor)
      // Line 3 (index 2): distance 1 (first non-empty line above cursor)
      // Line 5 (index 4): distance 0 (cursor line)
      // Line 6 (index 5): distance 1 (first non-empty line below cursor)
      expect(result.size).toBe(5);
      
      expect(result.get(0)).toBe(3);
      expect(result.get(1)).toBe(2);
      expect(result.get(2)).toBe(1);
      expect(result.get(4)).toBe(0);
      expect(result.get(5)).toBe(1);
    });
    
    test('should handle cursor at first line', () => {
      const lines = [
        'Line 1',     // Cursor here
        '',           // Empty line
        'Line 3',
        'Line 4'
      ];
      const cursorLineIndex = 0; // Line 1
      
      const result = calculateEffectiveDistances(lines, cursorLineIndex);
      
      // Expected:
      // Line 1 (index 0): distance 0 (cursor line)
      // Line 3 (index 2): distance 1 (first non-empty line below cursor)
      // Line 4 (index 3): distance 2 (second non-empty line below cursor)
      expect(result.size).toBe(3);
      
      expect(result.get(0)).toBe(0);
      expect(result.get(2)).toBe(1);
      expect(result.get(3)).toBe(2);
    });
    
    test('should handle cursor at last line', () => {
      const lines = [
        'Line 1',
        'Line 2',
        '',           // Empty line
        'Line 4'      // Cursor here
      ];
      const cursorLineIndex = 3; // Line 4
      
      const result = calculateEffectiveDistances(lines, cursorLineIndex);
      
      // Expected:
      // Line 1 (index 0): distance 2 (second non-empty line above cursor)
      // Line 2 (index 1): distance 1 (first non-empty line above cursor)
      // Line 4 (index 3): distance 0 (cursor line)
      expect(result.size).toBe(3);
      
      expect(result.get(0)).toBe(2);
      expect(result.get(1)).toBe(1);
      expect(result.get(3)).toBe(0);
    });
  });
}); 