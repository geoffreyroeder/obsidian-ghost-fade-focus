/**
 * Note: This file is kept for backward compatibility.
 * The functionality has been moved to more specific modules:
 * - document-analysis.ts: Line analysis and distance calculations
 * - dom-utils.ts: DOM manipulation and styling
 * 
 * Please use the functions from those modules directly in new code.
 */

// Re-export the functions from the new modules for backward compatibility
export { isEmptyLine, calculateEffectiveDistances } from "./document-analysis";
export { removeExistingFadeClasses, applyLineNumberFading } from "./dom-utils"; 