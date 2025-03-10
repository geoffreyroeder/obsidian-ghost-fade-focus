/**
 * Improved Obsidian API mock based on official documentation
 * This provides a more accurate representation of the actual Obsidian API
 */

// Basic types and interfaces
interface TFile {
  path: string;
  name: string;
  vault: Vault;
  basename: string;
  extension: string;
}

interface Vault {
  adapter: {
    read: (path: string) => Promise<string>;
    write: (path: string, data: string) => Promise<void>;
  };
  getFiles: () => TFile[];
}

interface WorkspaceLeaf {
  view: View;
}

interface View {
  getViewType: () => string;
}

// Editor interface for text editing
interface Editor {
  getValue(): string;
  setValue(value: string): void;
  getLine(line: number): string;
  lineCount(): number;
  getCursor(): { line: number; ch: number };
}

// Plugin class that matches Obsidian's API more closely
class ObsidianPlugin {
  app: App;
  manifest: {
    id: string;
    name: string;
    version: string;
    minAppVersion: string;
    description: string;
    author: string;
    authorUrl: string;
  };
  
  constructor(app: App, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }
  
  // Core plugin methods
  onload(): void {}
  onunload(): void {}
  
  // Data storage methods
  loadData(): Promise<any> {
    return Promise.resolve({});
  }
  
  saveData(data: any): Promise<void> {
    return Promise.resolve();
  }
  
  // Registration methods
  registerView(type: string, viewCreator: any): void {}
  registerExtensions(extensions: string[], viewType: string): void {}
  registerMarkdownPostProcessor(processor: any): void {}
  registerEditorExtension(extension: any): void {}
  registerMarkdownCodeBlockProcessor(language: string, processor: any): void {}
  
  // UI methods
  addRibbonIcon(icon: string, title: string, callback: any): HTMLElement {
    return document.createElement('div');
  }
  
  addStatusBarItem(): HTMLElement {
    return document.createElement('div');
  }
  
  addCommand(command: {
    id: string;
    name: string;
    checkCallback?: (checking: boolean) => boolean | void;
    callback?: () => any;
    hotkeys?: any[];
  }): void {}
  
  addSettingTab(tab: SettingTab): void {}
}

// App represents the main Obsidian application
class App {
  vault: Vault;
  workspace: {
    activeLeaf: WorkspaceLeaf | null;
    getActiveViewOfType: <T extends View>(type: any) => T | null;
    on: (event: string, callback: any) => void;
    off: (event: string, callback: any) => void;
  };
  
  constructor() {
    this.vault = {
      adapter: {
        read: (path: string) => Promise.resolve(""),
        write: (path: string, data: string) => Promise.resolve()
      },
      getFiles: () => []
    };
    
    this.workspace = {
      activeLeaf: null,
      getActiveViewOfType: jest.fn().mockReturnValue({
        getMode: jest.fn().mockReturnValue('source')
      }),
      on: jest.fn(),
      off: jest.fn()
    };
  }
}

// MarkdownView represents a markdown editor view
class MarkdownView {
  file: TFile | null;
  editor: Editor;
  
  constructor() {
    this.file = null;
    this.editor = {
      getValue: () => "",
      setValue: () => {},
      getLine: () => "",
      lineCount: () => 0,
      getCursor: () => ({ line: 0, ch: 0 })
    };
  }
  
  getMode(): string {
    return 'source';
  }
  
  getViewType(): string {
    return 'markdown';
  }
}

// Setting tab for plugin settings
class SettingTab {
  app: App;
  containerEl: HTMLElement;
  
  constructor(app: App) {
    this.app = app;
    this.containerEl = document.createElement('div');
  }
  
  display(): void {}
}

// Plugin setting tab
class PluginSettingTab extends SettingTab {
  plugin: ObsidianPlugin;
  
  constructor(app: App, plugin: ObsidianPlugin) {
    super(app);
    this.plugin = plugin;
  }
}

// Setting builder for creating settings UI
class Setting {
  settingEl: HTMLElement;
  
  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    containerEl.appendChild(this.settingEl);
  }
  
  setName(name: string): this {
    return this;
  }
  
  setDesc(desc: string): this {
    return this;
  }
  
  addToggle(callback: (toggle: any) => any): this {
    return this;
  }
  
  addSlider(callback: (slider: any) => any): this {
    return this;
  }
  
  addText(callback: (text: any) => any): this {
    return this;
  }
  
  addButton(callback: (button: any) => any): this {
    return this;
  }
  
  addDropdown(callback: (dropdown: any) => any): this {
    return this;
  }
}

// Platform information
const Platform = {
  isMobile: false,
  isDesktop: true,
  isMacOS: true,
  isWindows: false,
  isLinux: false
};

// Export with Plugin mapped to our ObsidianPlugin class
module.exports = { 
  App,
  Plugin: ObsidianPlugin, // Map 'Plugin' to our renamed class
  MarkdownView,
  PluginSettingTab,
  Setting,
  Platform
}; 