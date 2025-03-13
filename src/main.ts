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
import { isEmptyLine, calculateEffectiveDistances } from "./utils";

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
 */
export default class GhostFocusPlugin extends Plugin {
  settings: GhostFocusSettings;
  rootElement: HTMLElement;

  async loadSettings() {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * Add CSS variables to the root element based on settings
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

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new GhostFocusSettingTab(this.app, this));
    this.registerCommands();
    this.registerEditorExtensions();
    this.cssVariablesBasedOnEnabledState();
  }

  /**
   * Register plugin commands
   */
  registerCommands() {
    this.addCommand({
      id: "toggle-plugin",
      name: "Toggle plugin on/off",
      checkCallback: (checking: boolean) => {
        const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (mdView && mdView.getMode() === "source") {
          if (!checking) {
            this.settings.enabled = !this.settings.enabled;
            this.saveSettings();
            this.cssVariablesBasedOnEnabledState();
          }
          return true;
        }
        return false;
      },
    });
  }

  /**
   * Register the editor extensions
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
   * Update CSS variables based on enabled state
   */
  cssVariablesBasedOnEnabledState() {
    if (this.settings.enabled) {
      this.addCSSVariables();
    } else {
      this.removeCSSVariables();
    }
  }
}

/**
 * Creates a view plugin that manages faded lines
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
 */
function needsDecorationsUpdate(update: ViewUpdate): boolean {
  return update.docChanged || 
         update.viewportChanged || 
         update.selectionSet;
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
 * Main function to create all line decorations
 */
function createFadedLineDecorations(view: EditorView, settings: GhostFocusSettings): DecorationSet {
  // Get the cursor position and extract visible lines
  const cursorPosition = view.state.selection.main.head;
  const visibleLinesContext = extractVisibleLines(view, cursorPosition);
  
  // Log debug information if enabled
  logDebugInfo(visibleLinesContext, settings);
  
  // Calculate distances from cursor
  const effectiveDistances = calculateEffectiveDistances(
    visibleLinesContext.lines.map(line => line.text), 
    visibleLinesContext.cursorLineIndex
  );
  
  // Log distance calculations if debug mode is enabled
  logDistanceDebugInfo(visibleLinesContext, effectiveDistances, settings);
  
  // Build and return the decorations
  return buildDecorations(visibleLinesContext, effectiveDistances, view, settings);
}

/**
 * Extracts all visible lines and their information
 */
function extractVisibleLines(view: EditorView, cursorPosition: number): VisibleLinesContext {
  const visibleLines: LineInfo[] = [];
  const cursorLineNumber = view.state.doc.lineAt(cursorPosition).number;
  
  // Extract all visible lines
  for (const { from, to } of view.visibleRanges) {
    let position = from;
    
    while (position <= to) {
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
  
  // Find the cursor line index in our visible lines array
  const cursorLineIndex = visibleLines.findIndex(
    line => line.number === cursorLineNumber
  );
  
  return {
    lines: visibleLines,
    cursorLineIndex: cursorLineIndex,
    cursorLineNumber: cursorLineNumber
  };
}

/**
 * Builds the decoration set based on calculated distances
 */
function buildDecorations(
  visibleContext: VisibleLinesContext,
  effectiveDistances: Map<number, number>,
  view: EditorView,
  settings: GhostFocusSettings
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const { lines } = visibleContext;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineInfo = lines[lineIndex];
    
    // Skip empty lines - they don't get decorations
    if (isEmptyLine(lineInfo.text)) {
      if (settings.debugMode) {
        console.log(`[DEBUG] Skipping decoration for empty line ${lineInfo.number}`);
      }
      continue;
    }
    
    // Get the calculated distance for this line
    const distance = effectiveDistances.get(lineIndex) || 0;
    
    if (settings.debugMode) {
      console.log(
        `[DEBUG] Applying decoration with distance ${distance} to line ${lineInfo.number}`
      );
    }
    
    // Apply the appropriate decoration based on distance
    if (distance <= 5) {
      builder.add(lineInfo.from, lineInfo.from, createFadedLineDecoration(distance));
    } else {
      builder.add(lineInfo.from, lineInfo.from, createDefaultFadedLineDecoration());
    }
  }
  
  return builder.finish();
}

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
