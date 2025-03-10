/**
 * Tests for the plugin's settings functionality
 */

import { DEFAULT_SETTINGS, GhostFocusSettings } from '../settings';

// Mock plugin class with settings functionality
class MockGhostFocusPlugin {
  // Explicitly define all required properties to avoid TypeScript errors
  settings: GhostFocusSettings = {
    enabled: DEFAULT_SETTINGS.enabled ?? false,
    opacity_1: DEFAULT_SETTINGS.opacity_1 ?? 0.85,
    opacity_2: DEFAULT_SETTINGS.opacity_2 ?? 0.7,
    opacity_3: DEFAULT_SETTINGS.opacity_3 ?? 0.55,
    opacity_4: DEFAULT_SETTINGS.opacity_4 ?? 0.4,
    opacity_5: DEFAULT_SETTINGS.opacity_5 ?? 0.25,
    opacity: DEFAULT_SETTINGS.opacity ?? 0.1
  };
  savedData: any = null;
  
  async loadSettings() {
    // Mock implementation that merges default settings with loaded data
    const loadedData = await this.loadData();
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loadedData
    } as GhostFocusSettings;
  }
  
  async saveSettings() {
    // Mock implementation that saves settings
    await this.saveData(this.settings);
  }
  
  // Mock data storage methods
  async loadData() {
    return this.savedData || {};
  }
  
  async saveData(data: any) {
    this.savedData = data;
    return Promise.resolve();
  }
}

describe('Plugin Settings', () => {
  let plugin: MockGhostFocusPlugin;
  
  beforeEach(() => {
    plugin = new MockGhostFocusPlugin();
    plugin.savedData = null;
  });
  
  describe('loadSettings', () => {
    test('loads default settings when no saved data exists', async () => {
      await plugin.loadSettings();
      
      // Should have default settings
      expect(plugin.settings.enabled).toBe(DEFAULT_SETTINGS.enabled);
      expect(plugin.settings.opacity_1).toBe(DEFAULT_SETTINGS.opacity_1);
      expect(plugin.settings.opacity_2).toBe(DEFAULT_SETTINGS.opacity_2);
      expect(plugin.settings.opacity_3).toBe(DEFAULT_SETTINGS.opacity_3);
      expect(plugin.settings.opacity_4).toBe(DEFAULT_SETTINGS.opacity_4);
      expect(plugin.settings.opacity_5).toBe(DEFAULT_SETTINGS.opacity_5);
      expect(plugin.settings.opacity).toBe(DEFAULT_SETTINGS.opacity);
    });
    
    test('merges saved data with default settings', async () => {
      // Set up some saved data
      plugin.savedData = {
        enabled: true,
        opacity_1: 0.95
      };
      
      await plugin.loadSettings();
      
      // Should merge saved data with defaults
      expect(plugin.settings.enabled).toBe(true);
      expect(plugin.settings.opacity_1).toBe(0.95);
      expect(plugin.settings.opacity_2).toBe(DEFAULT_SETTINGS.opacity_2);
      expect(plugin.settings.opacity_3).toBe(DEFAULT_SETTINGS.opacity_3);
      expect(plugin.settings.opacity_4).toBe(DEFAULT_SETTINGS.opacity_4);
      expect(plugin.settings.opacity_5).toBe(DEFAULT_SETTINGS.opacity_5);
      expect(plugin.settings.opacity).toBe(DEFAULT_SETTINGS.opacity);
    });
  });
  
  describe('saveSettings', () => {
    test('saves current settings', async () => {
      // Modify settings
      plugin.settings.enabled = true;
      plugin.settings.opacity_1 = 0.99;
      plugin.settings.opacity = 0.05;
      
      await plugin.saveSettings();
      
      // Verify saved data
      expect(plugin.savedData.enabled).toBe(true);
      expect(plugin.savedData.opacity_1).toBe(0.99);
      expect(plugin.savedData.opacity_2).toBe(DEFAULT_SETTINGS.opacity_2);
      expect(plugin.savedData.opacity_3).toBe(DEFAULT_SETTINGS.opacity_3);
      expect(plugin.savedData.opacity_4).toBe(DEFAULT_SETTINGS.opacity_4);
      expect(plugin.savedData.opacity_5).toBe(DEFAULT_SETTINGS.opacity_5);
      expect(plugin.savedData.opacity).toBe(0.05);
    });
  });
  
  describe('DEFAULT_SETTINGS', () => {
    test('has expected default values', () => {
      expect(DEFAULT_SETTINGS.enabled).toBe(false);
      expect(DEFAULT_SETTINGS.opacity_1).toBe(0.85);
      expect(DEFAULT_SETTINGS.opacity_2).toBe(0.7);
      expect(DEFAULT_SETTINGS.opacity_3).toBe(0.55);
      expect(DEFAULT_SETTINGS.opacity_4).toBe(0.4);
      expect(DEFAULT_SETTINGS.opacity_5).toBe(0.25);
      expect(DEFAULT_SETTINGS.opacity).toBe(0.1);
    });
  });
}); 