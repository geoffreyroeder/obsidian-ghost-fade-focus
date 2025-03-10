// Utility function to detect empty lines
export function isEmptyLine(text: string): boolean {
  return text.trim() === "";
}

// Helper function for calculating effective distances - exported for testing
export function calculateEffectiveDistances(
  lines: string[], 
  cursorLineIndex: number
): Map<number, number> {
  const nonEmptyLines = new Map<number, number>();
  
  // First collect all non-empty lines above cursor
  const nonEmptyIndicesAbove: number[] = [];
  for (let i = 0; i < cursorLineIndex; i++) {
    if (!isEmptyLine(lines[i])) {
      nonEmptyIndicesAbove.push(i);
    }
  }
  
  // Assign distances to lines above cursor
  // Line closest to cursor gets distance 1, next gets 2, etc.
  for (let i = nonEmptyIndicesAbove.length - 1; i >= 0; i--) {
    const lineIndex = nonEmptyIndicesAbove[i];
    const distance = nonEmptyIndicesAbove.length - i;
    nonEmptyLines.set(lineIndex, distance);
  }
  
  // Set cursor line distance to 0
  if (!isEmptyLine(lines[cursorLineIndex])) {
    nonEmptyLines.set(cursorLineIndex, 0);
  }
  
  // Collect all non-empty lines below cursor
  const nonEmptyIndicesBelow: number[] = [];
  for (let i = cursorLineIndex + 1; i < lines.length; i++) {
    if (!isEmptyLine(lines[i])) {
      nonEmptyIndicesBelow.push(i);
    }
  }
  
  // Assign distances to lines below cursor
  // Line closest to cursor gets distance 1, next gets 2, etc.
  for (let i = 0; i < nonEmptyIndicesBelow.length; i++) {
    const lineIndex = nonEmptyIndicesBelow[i];
    const distance = i + 1;
    nonEmptyLines.set(lineIndex, distance);
  }
  
  return nonEmptyLines;
} 