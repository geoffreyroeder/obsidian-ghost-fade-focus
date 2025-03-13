import { Plugin, MarkdownView } from "obsidian";
import {
  EditorView,
  Decoration,
  ViewPlugin,
  DecorationSet,
  ViewUpdate,
} from "@codemirror/view";
import { Extension, RangeSetBuilder } from "@codemirror/state";
import {
  GhostFocusSettingTab,
  GhostFocusSettings,
  DEFAULT_SETTINGS,
} from "./settings";
import { 
  isEmptyLine, 
  calculateEffectiveDistances,
  removeExistingFadeClasses,
  applyLineNumberFading
} from "./utils";

/**
 * Represents information about a line in the document
 */
interface LineInfo {
  text: string;     // The text content of the line
  number: number;   // The line number in the document
  from: number;     // The start position of the line
  to: number;       // The end position of the line
}

/**
 * Manages visible lines and their relationship to the cursor
 */
interface VisibleLinesContext {
  lines: LineInfo[];        // All visible lines
  cursorLineIndex: number;  // Index of cursor line in the lines array
  cursorLineNumber: number; // The actual line number of the cursor
}

/**
 * Ghost Fade Focus Plugin - Provides focus mode that fades text based on distance from cursor
 * 
 * This plugin creates a focus experience that dims text based on its distance from the
 * cursor position, ignoring empty lines for a more natural reading experience.
 */
export default class GhostFocusPlugin extends Plugin {
  settings: GhostFocusSettings;
  rootElement: HTMLElement;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new GhostFocusSettingTab(this.app, this));
    this.registerCommands();
    this.registerEditorExtensions();
    this.cssVariablesBasedOnEnabledState();
  }

  onunload() {
    this.removeCSSVariables();
    this.resetLineNumberStyles();
  }

  /**
   * Load user settings or fall back to defaults
   */
  async loadSettings() {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * Save user settings
   */
  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * Register plugin commands for toggling the effect
   */
  registerCommands() {
    this.addCommand({
      id: "toggle-plugin",
      name: "Toggle plugin on/off",
      checkCallback: (checking: boolean) => {
        const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (mdView && mdView.getMode() === "source") {
          if (!checking) {
            this.toggleGhostFocus();
          }
          return true;
        }
        return false;
      },
    });
  }

  /**
   * Register the editor extensions that apply the fading effect
   */
  registerEditorExtensions() {
    const baseTheme = EditorView.baseTheme({});
    const plugin = this;

    // Create editor extension with the faded lines view plugin
    const fadedLines = (): Extension => {
      return [baseTheme, [], createFadedLinesViewPlugin(plugin)];
    };

    this.registerEditorExtension(fadedLines());
  }

  /**
   * Toggle the plugin's active state
   */
  async toggleGhostFocus(): Promise<void> {
    this.settings.enabled = !this.settings.enabled;
    
    if (this.settings.enabled) {
      // Re-enable all extensions
      this.registerEditorExtensions();
    } else {
      // Remove all extensions
      this.cleanUpEditorExtensions();
      
      // Additionally, remove any existing line number fade classes
      this.resetLineNumberStyles();
    }
    
    this.cssVariablesBasedOnEnabledState();
    await this.saveSettings();
  }

  /**
   * Update CSS variables based on the enabled state
   * 
   * This ensures the variables are only present when the plugin is active,
   * preventing potential conflicts with other plugins.
   */
  cssVariablesBasedOnEnabledState() {
    if (this.settings.enabled) {
      this.addCSSVariables();
    } else {
      this.removeCSSVariables();
    }
  }

  /**
   * Add CSS variables to the root element based on settings
   * 
   * These variables control the different opacity levels for text
   * at different distances from the cursor.
   */
  addCSSVariables() {
    this.rootElement = document.documentElement;
    this.rootElement.style.setProperty(
      "--ghost-fade-focus-opacity-1",
      `${this.settings.opacity_1}`
    );
    this.rootElement.style.setProperty(
      "--ghost-fade-focus-opacity-2",
      `${this.settings.opacity_2}`
    );
    this.rootElement.style.setProperty(
      "--ghost-fade-focus-opacity-3",
      `${this.settings.opacity_3}`
    );
    this.rootElement.style.setProperty(
      "--ghost-fade-focus-opacity-4",
      `${this.settings.opacity_4}`
    );
    this.rootElement.style.setProperty(
      "--ghost-fade-focus-opacity-5",
      `${this.settings.opacity_5}`
    );
    this.rootElement.style.setProperty(
      "--ghost-fade-focus-opacity",
      `${this.settings.opacity}`
    );
  }

  /**
   * Remove CSS variables from the root element
   */
  removeCSSVariables() {
    this.rootElement = document.documentElement;
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity-1");
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity-2");
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity-3");
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity-4");
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity-5");
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity");
  }

  /**
   * Remove ghost-fade-focus classes from all line number elements
   * 
   * This ensures a clean state when the plugin is disabled.
   */
  resetLineNumberStyles(): void {
    try {
      const lineNumbers = document.querySelectorAll('.cm-gutter.cm-lineNumbers .cm-gutterElement');
      
      lineNumbers.forEach(element => {
        // Cast to HTMLElement to ensure type safety
        const el = element as HTMLElement;
        removeExistingFadeClasses(el);
      });
      
      if (this.settings.debugMode) {
        console.log(`[DEBUG] Reset styles for ${lineNumbers.length} line number elements`);
      }
    } catch (error) {
      // Gracefully handle any errors during cleanup
      if (this.settings.debugMode) {
        console.log(`[DEBUG] Error during style cleanup: ${error.message}`);
      }
    }
  }

  /**
   * Remove all registered editor extensions
   * 
   * This is called when the plugin is disabled to ensure
   * all extensions are properly cleaned up.
   */
  cleanUpEditorExtensions() {
    // This will remove all editor extensions we've registered
    // Obsidian handles this automatically when the extension array is empty
    this.app.workspace.updateOptions();
  }
}

//==============================================================================
// VIEW PLUGIN IMPLEMENTATION
//==============================================================================

/**
 * Creates a view plugin that manages faded lines
 * 
 * This creates the core plugin that handles the decoration of text
 * lines based on their distance from the cursor.
 */
function createFadedLinesViewPlugin(plugin: GhostFocusPlugin) {
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

//==============================================================================
// DECORATION CREATION AND MANAGEMENT
//==============================================================================

/**
 * Main function to create all line decorations
 * 
 * This orchestrates the process of:
 * 1. Getting visible lines and cursor position
 * 2. Calculating distances from cursor
 * 3. Applying decorations to both text and line numbers
 */
function createFadedLineDecorations(view: EditorView, settings: GhostFocusSettings): DecorationSet {
  // Get the cursor position and extract visible lines
  const cursorPosition = view.state.selection.main.head;
  const visibleLinesContext = extractVisibleLines(view, cursorPosition);
  
  // Log debug information if enabled
  logDebugInfo(visibleLinesContext, settings);
  
  // Calculate distances from cursor, ignoring empty lines
  const effectiveDistances = calculateEffectiveDistances(
    visibleLinesContext.lines.map(line => line.text), 
    visibleLinesContext.cursorLineIndex
  );
  
  // Log distance calculations if debug mode is enabled
  logDistanceDebugInfo(visibleLinesContext, effectiveDistances, settings);
  
  // Apply fading to line numbers
  applyGutterFading(view, visibleLinesContext, effectiveDistances, settings);
  
  // Build and return the text line decorations
  return buildLineDecorations(visibleLinesContext, effectiveDistances, settings);
}

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
  lineIndex: number, 
  settings: GhostFocusSettings
): boolean {
  const isEmpty = isEmptyLine(lineInfo.text);
  
  if (isEmpty && settings.debugMode) {
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

//==============================================================================
// LINE NUMBER FADING
//==============================================================================

/**
 * Applies fading to line number gutter elements based on distances from cursor
 * 
 * This coordinates the process of:
 * 1. Finding line number elements
 * 2. Creating a mapping from line numbers to distances
 * 3. Applying appropriate opacity classes to line numbers
 */
function applyGutterFading(
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
  }
  
  // Create mapping from line number to distance
  const lineNumberToDistance = createLineNumberDistanceMap(
    visibleContext, 
    effectiveDistances, 
    settings
  );
  
  // Apply fading classes to gutter elements using the utility function
  applyLineNumberFading(gutterElements, lineNumberToDistance);
}

/**
 * Creates a mapping from line numbers to their distances from cursor
 * 
 * This extracts only the relevant line numbers and their distances,
 * focusing only on non-empty lines that have calculated distances.
 */
function createLineNumberDistanceMap(
  visibleContext: VisibleLinesContext,
  effectiveDistances: Map<number, number>,
  settings: GhostFocusSettings
): Map<number, number> {
  const lineNumberToDistance = new Map<number, number>();
  
  visibleContext.lines.forEach((line, index) => {
    // Only map non-empty lines that have a calculated distance
    if (!isEmptyLine(line.text) && effectiveDistances.has(index)) {
      const distance = effectiveDistances.get(index) || 0;
      lineNumberToDistance.set(line.number, distance);
      
      if (settings.debugMode) {
        console.log(`[DEBUG] Line ${line.number} mapped to distance ${distance}`);
      }
    }
  });
  
  return lineNumberToDistance;
}

//==============================================================================
// DOCUMENT ANALYSIS
//==============================================================================

/**
 * Extracts all visible lines and their information
 * 
 * This function:
 * - Gets all lines currently visible in the editor viewport
 * - Determines which line contains the cursor
 * - Creates a context object with all this information
 */
function extractVisibleLines(view: EditorView, cursorPosition: number): VisibleLinesContext {
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

//==============================================================================
// DEBUGGING HELPERS
//==============================================================================

/**
 * Logs basic debug information if debug mode is enabled
 */
function logDebugInfo(
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
function logDistanceDebugInfo(
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
