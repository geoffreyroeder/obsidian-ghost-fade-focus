/**
 * Decorations Module
 * 
 * Handles the creation and management of text decorations for the Ghost Fade Focus plugin.
 * This includes creating the view plugin and managing decoration sets.
 */

import {
  EditorView,
  Decoration,
  ViewPlugin,
  DecorationSet,
  ViewUpdate,
} from "@codemirror/view";
import { Extension, RangeSetBuilder } from "@codemirror/state";

import { 
  VisibleLinesContext, 
  LineInfo, 
  isEmptyLine, 
  extractVisibleLines 
} from "./document-analysis";
import { applyGutterFading } from "./dom-utils";
import { logDebugInfo, logDistanceDebugInfo } from "./debug";
import { GhostFocusSettings } from "./settings";

/**
 * Creates a view plugin that manages faded lines
 * 
 * This creates the core plugin that handles the decoration of text
 * lines based on their distance from the cursor.
 */
export function createFadedLinesViewPlugin(plugin: { settings: GhostFocusSettings }) {
  return ViewPlugin.fromClass(
    class FadedLinesViewPlugin {
      decorations: DecorationSet;
      
      constructor(view: EditorView) {
        this.decorations = createFadedLineDecorations(view, plugin.settings);
      }

      update(update: ViewUpdate) {
        if (needsDecorationsUpdate(update)) {
          this.decorations = createFadedLineDecorations(update.view, plugin.settings);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    }
  );
}

/**
 * Determines if the decorations need to be updated
 * 
 * We update decorations when:
 * - Document content changes
 * - Viewport changes (scrolling)
 * - Selection changes (cursor moves)
 */
function needsDecorationsUpdate(update: ViewUpdate): boolean {
  return update.docChanged || 
         update.viewportChanged || 
         update.selectionSet;
}

/**
 * Main function to create all line decorations
 * 
 * This orchestrates the process of:
 * 1. Getting visible lines and cursor position
 * 2. Calculating distances from cursor
 * 3. Applying decorations to both text and line numbers
 */
export function createFadedLineDecorations(view: EditorView, settings: GhostFocusSettings): DecorationSet {
  console.log(`[DEBUG] createFadedLineDecorations called`);
  
  // Get the cursor position and extract visible lines
  const cursorPosition = view.state.selection.main.head;
  console.log(`[DEBUG] Cursor position: ${cursorPosition}`);
  
  const visibleLinesContext = extractVisibleLines(view, cursorPosition);
  console.log(`[DEBUG] Extracted ${visibleLinesContext.lines.length} visible lines`);
  console.log(`[DEBUG] Cursor line index: ${visibleLinesContext.cursorLineIndex}`);
  
  // Log the first few visible lines
  if (settings.debugMode) {
    const sampleLines = visibleLinesContext.lines.slice(0, 5);
    console.log(`[DEBUG] First 5 visible lines:`, 
      sampleLines.map(line => ({
        number: line.number,
        text: line.text.substring(0, 20) + (line.text.length > 20 ? '...' : ''),
        isEmpty: isEmptyLine(line.text)
      }))
    );
  }
  
  // Calculate distances from cursor, ignoring empty lines
  const effectiveDistances = calculateEffectiveDistances(
    visibleLinesContext.lines.map(line => line.text), 
    visibleLinesContext.cursorLineIndex
  );
  
  console.log(`[DEBUG] Calculated ${effectiveDistances.size} effective distances`);
  
  // Log distance calculations if debug mode is enabled
  logDistanceDebugInfo(visibleLinesContext, effectiveDistances, settings);
  
  // Apply fading to line numbers
  console.log(`[DEBUG] Calling applyGutterFading`);
  applyGutterFading(view, visibleLinesContext, effectiveDistances, settings);
  console.log(`[DEBUG] applyGutterFading completed`);
  
  // Build and return the text line decorations
  return buildLineDecorations(visibleLinesContext, effectiveDistances, settings);
}

/**
 * Imports from document-analysis to make this module work independently
 * We re-import this to avoid circular dependencies
 */
import { calculateEffectiveDistances } from "./document-analysis";

/**
 * Creates a line decoration with the specified opacity index
 */
function createFadedLineDecoration(opacityIndex: number): Decoration {
  return Decoration.line({
    attributes: {
      class: `ghost-fade-focus--${opacityIndex}`,
    },
  });
}

/**
 * Creates a line decoration for lines beyond the 5-step opacity range
 */
function createDefaultFadedLineDecoration(): Decoration {
  return Decoration.line({
    attributes: {
      class: "ghost-fade-focus",
    },
  });
}

/**
 * Builds the decoration set for text lines based on calculated distances
 * 
 * This function:
 * - Skips empty lines (they don't get decorations)
 * - Applies appropriate opacity classes based on distance from cursor
 */
function buildLineDecorations(
  visibleContext: VisibleLinesContext,
  effectiveDistances: Map<number, number>,
  settings: GhostFocusSettings
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const { lines } = visibleContext;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    // Skip empty lines - they don't get decorations
    if (shouldSkipLine(lines[lineIndex], lineIndex, settings)) {
      continue;
    }
    
    // Apply decoration based on the line's distance from cursor
    applyLineDecoration(
      builder, 
      lines[lineIndex], 
      effectiveDistances.get(lineIndex) || 0,
      settings
    );
  }
  
  return builder.finish();
}

/**
 * Determines if a line should be skipped for decoration
 * 
 * Empty lines are skipped since they don't need fading.
 */
function shouldSkipLine(
  lineInfo: LineInfo, 
  lineIndex: number,  // DEBUG: why is this needed?
  settings: GhostFocusSettings
): boolean {
  const isEmpty = isEmptyLine(lineInfo.text);
  
  if (isEmpty && settings.debugMode) {
    // DEBUG: this is happening at startup
    console.log(`[DEBUG] Skipping decoration for empty line ${lineInfo.number}`);
  }
  
  return isEmpty;
}

/**
 * Applies the appropriate decoration to a line based on its distance from cursor
 */
function applyLineDecoration(
  builder: RangeSetBuilder<Decoration>,
  lineInfo: LineInfo,
  distance: number,
  settings: GhostFocusSettings
): void {
  if (settings.debugMode) {
    console.log(
      `[DEBUG] Applying decoration with distance ${distance} to line ${lineInfo.number}`
    );
  }
  
  if (distance <= 5) {
    builder.add(lineInfo.from, lineInfo.from, createFadedLineDecoration(distance));
  } else {
    builder.add(lineInfo.from, lineInfo.from, createDefaultFadedLineDecoration());
  }
} 