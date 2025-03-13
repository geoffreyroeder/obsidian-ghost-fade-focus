/**
 * Document Analysis Module
 * 
 * Handles the analysis of text documents, extracting visible lines,
 * and calculating distances between lines relative to cursor position.
 */

import { EditorView } from "@codemirror/view";

/**
 * Represents information about a line in the document
 */
export interface LineInfo {
  text: string;     // The text content of the line
  number: number;   // The line number in the document
  from: number;     // The start position of the line
  to: number;       // The end position of the line
}

/**
 * Manages visible lines and their relationship to the cursor
 */
export interface VisibleLinesContext {
  lines: LineInfo[];        // All visible lines
  cursorLineIndex: number;  // Index of cursor line in the lines array
  cursorLineNumber: number; // The actual line number of the cursor
}

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
 * Extracts all visible lines and their information
 * 
 * This function:
 * - Gets all lines currently visible in the editor viewport
 * - Determines which line contains the cursor
 * - Creates a context object with all this information
 */
export function extractVisibleLines(view: EditorView, cursorPosition: number): VisibleLinesContext {
  const visibleLines: LineInfo[] = [];
  const cursorLineNumber = view.state.doc.lineAt(cursorPosition).number;
  
  // Extract all visible lines from all visible ranges in the viewport
  for (const visibleRange of view.visibleRanges) {
    extractLinesFromRange(view, visibleRange.from, visibleRange.to, visibleLines);
  }
  
  // Find the cursor line index in our visible lines array
  const cursorLineIndex = findCursorLineIndex(visibleLines, cursorLineNumber);
  
  return {
    lines: visibleLines,
    cursorLineIndex: cursorLineIndex,
    cursorLineNumber: cursorLineNumber
  };
}

/**
 * Extracts lines from a specific visible range
 */
function extractLinesFromRange(
  view: EditorView,
  fromPosition: number,
  toPosition: number,
  visibleLines: LineInfo[]
): void {
  let position = fromPosition;
  
  while (position <= toPosition) {
    const lineObject = view.state.doc.lineAt(position);
    
    visibleLines.push({
      text: lineObject.text,
      number: lineObject.number,
      from: lineObject.from,
      to: lineObject.to
    });
    
    position = lineObject.to + 1;
  }
}

/**
 * Finds the index of the cursor line in the visible lines array
 */
function findCursorLineIndex(visibleLines: LineInfo[], cursorLineNumber: number): number {
  return visibleLines.findIndex(line => line.number === cursorLineNumber);
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