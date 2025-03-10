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
    
    // Create a closure that captures the plugin instance
    const plugin = this;

    const showFadedLines = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
          this.decorations = fadedLineDeco(view, plugin.settings);
        }

        update(update: ViewUpdate) {
          if (
            update.docChanged ||
            update.viewportChanged ||
            update.selectionSet
          ) {
            this.decorations = fadedLineDeco(update.view, plugin.settings);
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

    const fadedLineDeco = (view: EditorView, settings: GhostFocusSettings) => {
      const cursorPos = view.state.selection.main.head;
      const cursorPosLine = view.state.doc.lineAt(cursorPos).number;
      
      // Debug logging
      if (settings.debugMode) {
        console.log("[DEBUG] Cursor position:", cursorPos, "on line:", cursorPosLine);
        console.log("[DEBUG] Cursor line text:", view.state.doc.lineAt(cursorPos).text, 
          "isEmpty:", isEmptyLine(view.state.doc.lineAt(cursorPos).text));
      }

      // Extract visible lines for processing
      const visibleLines: string[] = [];
      const lineNumbers: number[] = [];
      
      for (let { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to; ) {
          let line = view.state.doc.lineAt(pos);
          visibleLines.push(line.text);
          lineNumbers.push(line.number);
          pos = line.to + 1;
        }
      }
      
      // Find the index of the cursor line in our visible lines array
      const cursorLineIndex = lineNumbers.indexOf(cursorPosLine);
      
      if (settings.debugMode) {
        console.log("[DEBUG] Cursor line index in visible lines:", cursorLineIndex);
        console.log("[DEBUG] Total visible lines:", visibleLines.length);
      }
      
      // Use the utility function to calculate effective distances
      const effectiveDistances = calculateEffectiveDistances(visibleLines, cursorLineIndex);
      
      if (settings.debugMode) {
        console.log("[DEBUG] Effective distances:", 
          Array.from(effectiveDistances.entries()).map(([idx, dist]) => 
            `Line ${lineNumbers[idx]}: distance ${dist}`).join(", "));
        console.log("[DEBUG] --- Applying decorations ---");
      }

      // Apply decorations based on the effective distances
      let builder = new RangeSetBuilder<Decoration>();
      for (let i = 0; i < visibleLines.length; i++) {
        const lineNumber = lineNumbers[i];
        const lineText = visibleLines[i];
        const isEmpty = isEmptyLine(lineText);
        
        if (settings.debugMode) {
          console.log("[DEBUG] Decoration for line", lineNumber, ":", 
            JSON.stringify(lineText), "isEmpty:", isEmpty);
        }
        
        if (!isEmpty) {
          const effectiveDistance = effectiveDistances.get(i) || 0;
          
          if (settings.debugMode) {
            console.log("[DEBUG] Applying decoration with distance", 
              effectiveDistance, "to line", lineNumber);
          }
          
          const line = view.state.doc.line(lineNumber);
          if (effectiveDistance <= 5) {
            builder.add(line.from, line.from, fadedLine(effectiveDistance));
          } else {
            builder.add(line.from, line.from, fadedLineOther());
          }
        } else if (settings.debugMode) {
          console.log("[DEBUG] Skipping decoration for empty line", lineNumber);
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
