/**
 * Tests for line number fading functionality
 */

import { EditorView } from '@codemirror/view';
import { applyLineNumberFading } from '../utils';

// Mock the DOM elements for line numbers
function createMockGutterElements(lineNumbers: number[]): HTMLElement[] {
  const elements: HTMLElement[] = [];
  
  lineNumbers.forEach(lineNum => {
    const element = document.createElement('div');
    element.className = 'cm-gutterElement';
    element.textContent = lineNum.toString();
    elements.push(element);
  });
  
  return elements;
}

describe('Line Number Fading', () => {
  beforeEach(() => {
    // Reset DOM environment before each test
    document.body.innerHTML = '';
  });
  
  test('should apply appropriate fade classes to line number elements based on distance', () => {
    // Create mock gutter elements
    const lineNumbers = [1, 2, 3, 4, 5];
    const gutterElements = createMockGutterElements(lineNumbers);
    
    // Add elements to the document
    const container = document.createElement('div');
    gutterElements.forEach(el => container.appendChild(el));
    document.body.appendChild(container);
    
    // Create a distance map (line 3 is the cursor line)
    const lineNumberToDistance = new Map<number, number>([
      [1, 2], // Line 1: distance 2
      [2, 1], // Line 2: distance 1
      [3, 0], // Line 3: cursor line (distance 0)
      [4, 1], // Line 4: distance 1
      [5, 2], // Line 5: distance 2
    ]);
    
    // Apply fading using the actual implementation
    applyLineNumberFading(gutterElements, lineNumberToDistance);
    
    // Verify classes were applied correctly
    expect(gutterElements[0].classList.contains('ghost-fade-focus--2')).toBe(true);
    expect(gutterElements[1].classList.contains('ghost-fade-focus--1')).toBe(true);
    expect(gutterElements[2].classList.contains('ghost-fade-focus--0')).toBe(true);
    expect(gutterElements[3].classList.contains('ghost-fade-focus--1')).toBe(true);
    expect(gutterElements[4].classList.contains('ghost-fade-focus--2')).toBe(true);
  });
  
  test('should handle active line by not applying fade classes', () => {
    // Create mock gutter elements
    const lineNumbers = [1, 2, 3, 4, 5];
    const gutterElements = createMockGutterElements(lineNumbers);
    
    // Make line 3 active
    gutterElements[2].classList.add('cm-active');
    
    // Add elements to the document
    const container = document.createElement('div');
    gutterElements.forEach(el => container.appendChild(el));
    document.body.appendChild(container);
    
    // Create a distance map (line 3 is the cursor line)
    const lineNumberToDistance = new Map<number, number>([
      [1, 2], // Line 1: distance 2
      [2, 1], // Line 2: distance 1
      [3, 0], // Line 3: cursor line (distance 0)
      [4, 1], // Line 4: distance 1
      [5, 2], // Line 5: distance 2
    ]);
    
    // Apply fading
    applyLineNumberFading(gutterElements, lineNumberToDistance);
    
    // Verify active line doesn't have fade classes
    expect(gutterElements[2].classList.contains('ghost-fade-focus--0')).toBe(false);
    expect(gutterElements[2].classList.contains('cm-active')).toBe(true);
    
    // Verify other lines have appropriate classes
    expect(gutterElements[0].classList.contains('ghost-fade-focus--2')).toBe(true);
    expect(gutterElements[1].classList.contains('ghost-fade-focus--1')).toBe(true);
    expect(gutterElements[3].classList.contains('ghost-fade-focus--1')).toBe(true);
    expect(gutterElements[4].classList.contains('ghost-fade-focus--2')).toBe(true);
  });
  
  test('should apply default fade class to lines with distance > 5', () => {
    // Create mock gutter elements
    const lineNumbers = [1, 2, 3, 10];
    const gutterElements = createMockGutterElements(lineNumbers);
    
    // Add elements to the document
    const container = document.createElement('div');
    gutterElements.forEach(el => container.appendChild(el));
    document.body.appendChild(container);
    
    // Create a distance map with a line far from cursor
    const lineNumberToDistance = new Map<number, number>([
      [1, 2],  // Line 1: distance 2
      [2, 0],  // Line 2: cursor line (distance 0)
      [3, 1],  // Line 3: distance 1
      [10, 8], // Line 10: distance 8 (beyond the 5-step range)
    ]);
    
    // Apply fading
    applyLineNumberFading(gutterElements, lineNumberToDistance);
    
    // Verify classes were applied correctly
    expect(gutterElements[0].classList.contains('ghost-fade-focus--2')).toBe(true);
    expect(gutterElements[1].classList.contains('ghost-fade-focus--0')).toBe(true);
    expect(gutterElements[2].classList.contains('ghost-fade-focus--1')).toBe(true);
    expect(gutterElements[3].classList.contains('ghost-fade-focus')).toBe(true);
    expect(gutterElements[3].classList.contains('ghost-fade-focus--8')).toBe(false);
  });
  
  test('should handle line numbers with no calculated distance', () => {
    // Create mock gutter elements
    const lineNumbers = [1, 2, 3, 4];
    const gutterElements = createMockGutterElements(lineNumbers);
    
    // Add elements to the document
    const container = document.createElement('div');
    gutterElements.forEach(el => container.appendChild(el));
    document.body.appendChild(container);
    
    // Create a distance map with missing lines (e.g., empty lines)
    const lineNumberToDistance = new Map<number, number>([
      [1, 1], // Line 1: distance 1
      [3, 0], // Line 3: cursor line (distance 0)
      // Line 2 and 4 are missing (they could be empty lines)
    ]);
    
    // Apply fading
    applyLineNumberFading(gutterElements, lineNumberToDistance);
    
    // Verify classes were applied only to lines with distances
    expect(gutterElements[0].classList.contains('ghost-fade-focus--1')).toBe(true);
    expect(gutterElements[1].classList.contains('ghost-fade-focus--1')).toBe(false); // No class
    expect(gutterElements[1].classList.contains('ghost-fade-focus')).toBe(false);    // No class
    expect(gutterElements[2].classList.contains('ghost-fade-focus--0')).toBe(true);
    expect(gutterElements[3].classList.contains('ghost-fade-focus--1')).toBe(false); // No class
    expect(gutterElements[3].classList.contains('ghost-fade-focus')).toBe(false);    // No class
  });
  
  test('should not apply classes to elements with hidden visibility', () => {
    // Create mock gutter elements
    const lineNumbers = [1, 2, 3];
    const gutterElements = createMockGutterElements(lineNumbers);
    
    // Make line 1 hidden
    gutterElements[0].style.visibility = 'hidden';
    
    // Add elements to the document
    const container = document.createElement('div');
    gutterElements.forEach(el => container.appendChild(el));
    document.body.appendChild(container);
    
    // Create a distance map
    const lineNumberToDistance = new Map<number, number>([
      [1, 2], // Line 1: distance 2 (but hidden)
      [2, 1], // Line 2: distance 1
      [3, 0], // Line 3: cursor line (distance 0)
    ]);
    
    // Apply fading
    applyLineNumberFading(gutterElements, lineNumberToDistance);
    
    // Hidden element should have no fade class
    expect(gutterElements[0].classList.contains('ghost-fade-focus--2')).toBe(false);
    
    // Visible elements should have appropriate classes
    expect(gutterElements[1].classList.contains('ghost-fade-focus--1')).toBe(true);
    expect(gutterElements[2].classList.contains('ghost-fade-focus--0')).toBe(true);
  });
}); 