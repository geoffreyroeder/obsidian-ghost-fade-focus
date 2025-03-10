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

export default class GhostFocusPlugin extends Plugin {
  settings: GhostFocusSettings;
  rootElement: HTMLElement;

  async loadSettings() {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

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

    const baseTheme = EditorView.baseTheme({});

    const fadedLines = (): Extension => {
      return [baseTheme, [], showFadedLines];
    };

    const showFadedLines = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
          this.decorations = fadedLineDeco(view);
        }

        update(update: ViewUpdate) {
          if (
            update.docChanged ||
            update.viewportChanged ||
            update.selectionSet
          ) {
            this.decorations = fadedLineDeco(update.view);
          }
        }
      },
      {
        decorations: (v) => v.decorations,
      }
    );

    const fadedLine = (index: number) =>
      Decoration.line({
        attributes: {
          class: `ghost-fade-focus--${index}`,
        },
      });

    const fadedLineOther = () =>
      Decoration.line({
        attributes: {
          class: `ghost-fade-focus`,
        },
      });

    const fadedLineDeco = (view: EditorView) => {
      const cursorPos = view.state.selection.main.head;
      const cursorPosLine = view.state.doc.lineAt(cursorPos).number;

      // Extract visible lines for processing
      const visibleLines: string[] = [];
      const lineNumbers: number[] = [];
      
      // First collect all visible lines
      for (let { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to; ) {
          let line = view.state.doc.lineAt(pos);
          visibleLines.push(line.text);
          lineNumbers.push(line.number);
          pos = line.to + 1;
        }
      }
      
      // Find the index of the cursor line in our array
      const cursorIndex = lineNumbers.indexOf(cursorPosLine);
      
      // Calculate effective distances using our helper function
      const nonEmptyLines = calculateEffectiveDistances(visibleLines, cursorIndex);
      
      // Second pass: Apply decorations based on the effective distances
      let builder = new RangeSetBuilder<Decoration>();
      for (let { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to; ) {
          let line = view.state.doc.lineAt(pos);
          const isEmpty = isEmptyLine(line.text);
          
          if (!isEmpty) {
            // Find the index of this line in our array
            const lineIndex = lineNumbers.indexOf(line.number);
            const effectiveDistance = nonEmptyLines.get(lineIndex) || 0;
            
            if (effectiveDistance <= 5) {
              builder.add(
                line.from,
                line.from,
                fadedLine(effectiveDistance)
              );
            } else {
              builder.add(line.from, line.from, fadedLineOther());
            }
          }
          pos = line.to + 1;
        }
      }
      return builder.finish();
    };
    this.registerEditorExtension(fadedLines());
    this.cssVariablesBasedOnEnabledState();
  }

  cssVariablesBasedOnEnabledState() {
    if (this.settings.enabled) {
      this.addCSSVariables();
    } else {
      this.removeCSSVariables();
    }
  }
}
