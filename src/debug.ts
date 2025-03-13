/**
 * Debug Module
 * 
 * Provides debugging utilities for the Ghost Fade Focus plugin.
 * These functions help with development and troubleshooting.
 */

import { VisibleLinesContext } from "./document-analysis";
import { GhostFocusSettings } from "./settings";
import { isEmptyLine } from "./document-analysis";

/**
 * Logs basic debug information if debug mode is enabled
 */
export function logDebugInfo(
  visibleContext: VisibleLinesContext,
  settings: GhostFocusSettings
): void {
  if (!settings.debugMode) {
    return;
  }
  
  const { cursorLineNumber, cursorLineIndex, lines } = visibleContext;
  
  console.log(`[DEBUG] Cursor on line: ${cursorLineNumber}`);
  console.log(
    `[DEBUG] Cursor line text: "${lines[cursorLineIndex]?.text}"`,
    `isEmpty: ${isEmptyLine(lines[cursorLineIndex]?.text)}`
  );
  console.log(`[DEBUG] Cursor line index in visible lines: ${cursorLineIndex}`);
  console.log(`[DEBUG] Total visible lines: ${lines.length}`);
}

/**
 * Logs distance calculations if debug mode is enabled
 */
export function logDistanceDebugInfo(
  visibleContext: VisibleLinesContext,
  distances: Map<number, number>,
  settings: GhostFocusSettings
): void {
  if (!settings.debugMode) {
    return;
  }
  
  console.log(
    "[DEBUG] Effective distances:",
    Array.from(distances.entries())
      .map(([idx, dist]) => `Line ${visibleContext.lines[idx].number}: distance ${dist}`)
      .join(", ")
  );
  console.log("[DEBUG] --- Applying decorations ---");
} 