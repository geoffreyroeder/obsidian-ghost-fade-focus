/**
 * Utility functions for the Ghost Fade Focus plugin
 */

/**
 * Determines if a line is empty (contains only whitespace)
 * 
 * @param text - The text content of a line
 * @returns true if the line is empty or contains only whitespace
 */
export function isEmptyLine(text: string): boolean {
  return text.trim() === "";
}

/**
 * Represents a collection of non-empty line indices above and below the cursor
 */
interface NonEmptyLineIndices {
  above: number[];  // Indices of non-empty lines above cursor
  below: number[];  // Indices of non-empty lines below cursor
}

/**
 * Calculates the effective distance of each non-empty line from the cursor line,
 * skipping empty lines in the distance calculation.
 * 
 * @param lines - Array of line text content
 * @param cursorLineIndex - Index of the cursor line in the lines array
 * @returns Map of line indices to their effective distances from cursor
 */
export function calculateEffectiveDistances(
  lines: string[], 
  cursorLineIndex: number
): Map<number, number> {
  const distanceMap = new Map<number, number>();
  
  // Handle invalid cursor position
  if (cursorLineIndex < 0 || cursorLineIndex >= lines.length) {
    return distanceMap;
  }
  
  // Collect all non-empty line indices
  const nonEmptyIndices = collectNonEmptyLineIndices(lines, cursorLineIndex);
  
  // Set cursor line distance to 0 (if it's not empty)
  if (cursorLineIndex >= 0 && cursorLineIndex < lines.length && !isEmptyLine(lines[cursorLineIndex])) {
    distanceMap.set(cursorLineIndex, 0);
  }
  
  // Calculate distances for lines above cursor
  assignDistancesAboveCursor(nonEmptyIndices.above, distanceMap);
  
  // Calculate distances for lines below cursor
  assignDistancesBelowCursor(nonEmptyIndices.below, distanceMap);
  
  return distanceMap;
}

/**
 * Collects indices of all non-empty lines, separated by their position relative to the cursor
 * 
 * @param lines - Array of line text content
 * @param cursorLineIndex - Index of the cursor line
 * @returns Object containing arrays of non-empty line indices above and below cursor
 */
function collectNonEmptyLineIndices(
  lines: string[],
  cursorLineIndex: number
): NonEmptyLineIndices {
  const nonEmptyIndicesAbove: number[] = [];
  const nonEmptyIndicesBelow: number[] = [];
  
  // Collect non-empty lines above cursor
  for (let i = 0; i < cursorLineIndex; i++) {
    if (!isEmptyLine(lines[i])) {
      nonEmptyIndicesAbove.push(i);
    }
  }
  
  // Collect non-empty lines below cursor
  for (let i = cursorLineIndex + 1; i < lines.length; i++) {
    if (!isEmptyLine(lines[i])) {
      nonEmptyIndicesBelow.push(i);
    }
  }
  
  return {
    above: nonEmptyIndicesAbove,
    below: nonEmptyIndicesBelow
  };
}

/**
 * Assigns distances to lines above the cursor
 * Lines closer to cursor get smaller distances
 * 
 * @param nonEmptyIndicesAbove - Indices of non-empty lines above cursor
 * @param distanceMap - Map to store the distance values
 */
function assignDistancesAboveCursor(
  nonEmptyIndicesAbove: number[],
  distanceMap: Map<number, number>
): void {
  // Iterate from bottom to top (closest to cursor first)
  for (let i = nonEmptyIndicesAbove.length - 1; i >= 0; i--) {
    const lineIndex = nonEmptyIndicesAbove[i];
    const distance = nonEmptyIndicesAbove.length - i;
    distanceMap.set(lineIndex, distance);
  }
}

/**
 * Assigns distances to lines below the cursor
 * Lines closer to cursor get smaller distances
 * 
 * @param nonEmptyIndicesBelow - Indices of non-empty lines below cursor
 * @param distanceMap - Map to store the distance values
 */
function assignDistancesBelowCursor(
  nonEmptyIndicesBelow: number[],
  distanceMap: Map<number, number>
): void {
  // Iterate from top to bottom (closest to cursor first)
  for (let i = 0; i < nonEmptyIndicesBelow.length; i++) {
    const lineIndex = nonEmptyIndicesBelow[i];
    const distance = i + 1;
    distanceMap.set(lineIndex, distance);
  }
}

/**
 * Removes any existing fade classes from an element
 */
export function removeExistingFadeClasses(element: HTMLElement): void {
  element.classList.remove(
    'ghost-fade-focus',
    'ghost-fade-focus--1',
    'ghost-fade-focus--2',
    'ghost-fade-focus--3',
    'ghost-fade-focus--4',
    'ghost-fade-focus--5'
  );
}

/**
 * Applies fade classes to line number elements based on distance map
 * 
 * This function is exported for both usage in the plugin and for testing
 */
export function applyLineNumberFading(
  gutterElements: NodeListOf<Element> | HTMLElement[],
  lineNumberToDistance: Map<number, number>
): void {
  gutterElements.forEach(element => {
    // Cast to HTMLElement to access style property
    const el = element as HTMLElement;
    
    // Get line number (content of the element)
    const lineNumber = parseInt(el.textContent || '0', 10);
    if (isNaN(lineNumber)) return;
    
    // Remove any existing ghost-fade classes
    removeExistingFadeClasses(el);
    
    // Skip if it's the active line
    if (el.classList.contains('cm-active')) return;
    
    // Skip hidden elements - check if visibility is explicitly set to 'hidden'
    try {
      if (el.style.visibility === 'hidden') return;
    } catch (error) {
      // If visibility property access causes error, ignore and continue
    }
    
    // Apply the appropriate class based on distance
    const distance = lineNumberToDistance.get(lineNumber);
    
    if (distance !== undefined) {
      if (distance <= 5) {
        el.classList.add(`ghost-fade-focus--${distance}`);
      } else {
        el.classList.add('ghost-fade-focus');
      }
    }
  });
} 