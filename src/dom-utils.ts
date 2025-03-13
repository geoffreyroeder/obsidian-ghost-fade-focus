/**
 * DOM Utilities Module
 * 
 * Handles all DOM-related operations including CSS variables and class manipulation.
 * This module provides functions for styling elements and applying fade classes.
 */

import { EditorView } from "@codemirror/view";
import { VisibleLinesContext, isEmptyLine } from "./document-analysis";
import { GhostFocusSettings } from "./settings";

/**
 * Applies CSS variables to the root element based on settings
 * 
 * @param settings - The plugin settings containing opacity values
 * @returns - The root element with applied CSS variables
 */
export function applyCSSVariables(settings: GhostFocusSettings): HTMLElement {
  const rootElement = document.documentElement;
  
  rootElement.style.setProperty(
    "--ghost-fade-focus-opacity-1",
    `${settings.opacity_1}`
  );
  rootElement.style.setProperty(
    "--ghost-fade-focus-opacity-2",
    `${settings.opacity_2}`
  );
  rootElement.style.setProperty(
    "--ghost-fade-focus-opacity-3",
    `${settings.opacity_3}`
  );
  rootElement.style.setProperty(
    "--ghost-fade-focus-opacity-4",
    `${settings.opacity_4}`
  );
  rootElement.style.setProperty(
    "--ghost-fade-focus-opacity-5",
    `${settings.opacity_5}`
  );
  rootElement.style.setProperty(
    "--ghost-fade-focus-opacity",
    `${settings.opacity}`
  );
  
  return rootElement;
}

/**
 * Removes CSS variables from the root element
 * 
 * @returns - The root element with CSS variables removed
 */
export function removeCSSVariables(): HTMLElement {
  const rootElement = document.documentElement;
  
  rootElement.style.removeProperty("--ghost-fade-focus-opacity-1");
  rootElement.style.removeProperty("--ghost-fade-focus-opacity-2");
  rootElement.style.removeProperty("--ghost-fade-focus-opacity-3");
  rootElement.style.removeProperty("--ghost-fade-focus-opacity-4");
  rootElement.style.removeProperty("--ghost-fade-focus-opacity-5");
  rootElement.style.removeProperty("--ghost-fade-focus-opacity");
  
  return rootElement;
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
  lineNumberToDistance: Map<number, number>,
  debugMode: boolean = false
): void {
  if (debugMode) {
    console.log(`[DEBUG] Applying fading to ${gutterElements.length} line number elements`);
    console.log(`[DEBUG] Distance map contains ${lineNumberToDistance.size} entries`);
  }

  gutterElements.forEach(element => {
    // Cast to HTMLElement to access style property
    const el = element as HTMLElement;
    
    // Get line number (content of the element)
    const lineNumber = parseInt(el.textContent || '0', 10);
    if (isNaN(lineNumber)) return;
    
    // Remove any existing ghost-fade classes
    removeExistingFadeClasses(el);
    
    // Skip if it's the active line
    if (el.classList.contains('cm-active')) {
      if (debugMode) {
        console.log(`[DEBUG] Skipping active line number ${lineNumber}`);
      }
      return;
    }
    
    // Skip hidden elements - check if visibility is explicitly set to 'hidden'
    try {
      if (el.style.visibility === 'hidden') {
        if (debugMode) {
          console.log(`[DEBUG] Skipping hidden line number ${lineNumber}`);
        }
        return;
      }
    } catch (error) {
      // If visibility property access causes error, ignore and continue
    }
    
    // Apply the appropriate class based on distance
    const distance = lineNumberToDistance.get(lineNumber);
    
    if (distance !== undefined) {
      if (distance <= 5) {
        el.classList.add(`ghost-fade-focus--${distance}`);
        if (debugMode) {
          console.log(`[DEBUG] Applied fade class ghost-fade-focus--${distance} to line number ${lineNumber}`);
        }
      } else {
        el.classList.add('ghost-fade-focus');
        if (debugMode) {
          console.log(`[DEBUG] Applied default fade class to line number ${lineNumber}`);
        }
      }
    } else if (debugMode) {
      console.log(`[DEBUG] No distance calculated for line number ${lineNumber}, not applying fade`);
    }
  });
}

/**
 * Applies fading to line number gutter elements based on distances from cursor
 * 
 * This coordinates the process of:
 * 1. Finding line number elements
 * 2. Creating a mapping from line numbers to distances
 * 3. Applying appropriate opacity classes to line numbers
 */
export function applyGutterFading(
  view: EditorView, 
  visibleContext: VisibleLinesContext,
  effectiveDistances: Map<number, number>,
  settings: GhostFocusSettings
): void {
  // Get all gutter elements
  const gutterElements = view.dom.querySelectorAll('.cm-gutter.cm-lineNumbers .cm-gutterElement');
  
  // Skip if no gutter elements (line numbers disabled)
  if (gutterElements.length === 0) return;
  
  if (settings.debugMode) {
    console.log(`[DEBUG] Found ${gutterElements.length} line number elements`);
    console.log(`[DEBUG] Visible context contains ${visibleContext.lines.length} lines`);
  }
  
  // Create mapping from line number to distance
  const lineNumberToDistance = createLineNumberDistanceMap(
    visibleContext, 
    effectiveDistances, 
    settings
  );
  
  // Apply fading classes to gutter elements using the utility function
  applyLineNumberFading(gutterElements, lineNumberToDistance, settings.debugMode);
}

/**
 * Creates a mapping from line numbers to their distances from cursor
 * 
 * This extracts the relevant line numbers and their distances,
 * including empty lines which get the distance of the nearest non-empty line.
 */
function createLineNumberDistanceMap(
  visibleContext: VisibleLinesContext,
  effectiveDistances: Map<number, number>,
  settings: GhostFocusSettings
): Map<number, number> {
  const lineNumberToDistance = new Map<number, number>();
  
  visibleContext.lines.forEach((line, index) => {
    // Include all lines that have a calculated distance
    if (effectiveDistances.has(index)) {
      const distance = effectiveDistances.get(index) || 0;
      lineNumberToDistance.set(line.number, distance);
      
      if (settings.debugMode) {
        console.log(`[DEBUG] Line ${line.number} mapped to distance ${distance}`);
      }
    } else if (isEmptyLine(line.text)) {
      // For empty lines, find the nearest non-empty line's distance
      let nearestDistance = findNearestNonEmptyLineDistance(index, visibleContext, effectiveDistances);
      lineNumberToDistance.set(line.number, nearestDistance);
      
      if (settings.debugMode) {
        console.log(`[DEBUG] Empty line ${line.number} mapped to distance ${nearestDistance} (from nearest non-empty line)`);
      }
    }
  });
  
  return lineNumberToDistance;
}

/**
 * Finds the distance of the nearest non-empty line to the given index
 */
function findNearestNonEmptyLineDistance(
  emptyLineIndex: number,
  visibleContext: VisibleLinesContext,
  effectiveDistances: Map<number, number>
): number {
  // Look for the nearest non-empty line above
  for (let i = emptyLineIndex - 1; i >= 0; i--) {
    if (!isEmptyLine(visibleContext.lines[i].text) && effectiveDistances.has(i)) {
      return effectiveDistances.get(i) || 0;
    }
  }
  
  // If no non-empty line above, look below
  for (let i = emptyLineIndex + 1; i < visibleContext.lines.length; i++) {
    if (!isEmptyLine(visibleContext.lines[i].text) && effectiveDistances.has(i)) {
      return effectiveDistances.get(i) || 0;
    }
  }
  
  // If no non-empty line found, use a default distance
  return 5; // Default to a medium distance
}

/**
 * Resets all line number styles by removing fade classes
 * 
 * @param debugMode - Whether to log debug information
 */
export function resetLineNumberStyles(debugMode: boolean): void {
  try {
    const lineNumbers = document.querySelectorAll('.cm-gutter.cm-lineNumbers .cm-gutterElement');
    
    lineNumbers.forEach(element => {
      // Cast to HTMLElement to ensure type safety
      const el = element as HTMLElement;
      removeExistingFadeClasses(el);
    });
    
    if (debugMode) {
      console.log(`[DEBUG] Reset styles for ${lineNumbers.length} line number elements`);
    }
  } catch (error) {
    // Gracefully handle any errors during cleanup
    if (debugMode) {
      console.log(`[DEBUG] Error during style cleanup: ${error.message}`);
    }
  }
} 