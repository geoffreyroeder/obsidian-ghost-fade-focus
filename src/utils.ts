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
  let effectiveDistanceUp = 0;
  let effectiveDistanceDown = 0;
  
  // Scan lines and calculate effective distances
  for (let i = 0; i < lines.length; i++) {
    const isEmpty = isEmptyLine(lines[i]);
    
    if (!isEmpty) {
      if (i < cursorLineIndex) {
        // Count up from bottom to cursor
        nonEmptyLines.set(i, effectiveDistanceUp);
        effectiveDistanceUp++;
      } else if (i > cursorLineIndex) {
        // Count down from cursor to bottom
        effectiveDistanceDown++;
        nonEmptyLines.set(i, effectiveDistanceDown);
      } else {
        // This is the cursor line
        nonEmptyLines.set(i, 0);
      }
    }
  }
  
  return nonEmptyLines;
} 