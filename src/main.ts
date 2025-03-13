import { Plugin, MarkdownView } from "obsidian";
import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";

import {
  GhostFocusSettingTab,
  GhostFocusSettings,
  DEFAULT_SETTINGS,
} from "./settings";

import { createFadedLinesViewPlugin } from "./decorations";
import { applyCSSVariables, removeCSSVariables, resetLineNumberStyles } from "./dom-utils";

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
    this.updateCSSBasedOnSettings();
  }

  onunload() {
    removeCSSVariables();
    resetLineNumberStyles(this.settings.debugMode);
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
      resetLineNumberStyles(this.settings.debugMode);
    }
    
    this.updateCSSBasedOnSettings();
    await this.saveSettings();
  }

  /**
   * Update CSS variables based on the enabled state
   * 
   * This ensures the variables are only present when the plugin is active,
   * preventing potential conflicts with other plugins.
   */
  updateCSSBasedOnSettings() {
    if (this.settings.enabled) {
      this.rootElement = applyCSSVariables(this.settings);
    } else {
      this.rootElement = removeCSSVariables();
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
