/**
 * Tests for CSS variable management functions
 */

import { DEFAULT_SETTINGS } from '../settings';

// Mock document.documentElement
const mockRootElement = {
  style: {
    setProperty: jest.fn(),
    removeProperty: jest.fn(),
  }
};

// Mock the plugin class with just the CSS variable functions
class MockGhostFocusPlugin {
  settings = { ...DEFAULT_SETTINGS };
  rootElement = mockRootElement;

  addCSSVariables() {
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
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity-1");
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity-2");
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity-3");
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity-4");
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity-5");
    this.rootElement.style.removeProperty("--ghost-fade-focus-opacity");
  }

  cssVariablesBasedOnEnabledState() {
    if (this.settings.enabled) {
      this.addCSSVariables();
    } else {
      this.removeCSSVariables();
    }
  }
}

describe('CSS Variable Management', () => {
  let plugin: MockGhostFocusPlugin;

  beforeEach(() => {
    // Reset mocks and create a fresh plugin instance
    jest.clearAllMocks();
    plugin = new MockGhostFocusPlugin();
  });

  describe('addCSSVariables', () => {
    test('sets all opacity CSS variables', () => {
      plugin.addCSSVariables();

      // Verify each CSS variable was set with the correct value
      expect(mockRootElement.style.setProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-1',
        String(DEFAULT_SETTINGS.opacity_1)
      );
      expect(mockRootElement.style.setProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-2',
        String(DEFAULT_SETTINGS.opacity_2)
      );
      expect(mockRootElement.style.setProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-3',
        String(DEFAULT_SETTINGS.opacity_3)
      );
      expect(mockRootElement.style.setProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-4',
        String(DEFAULT_SETTINGS.opacity_4)
      );
      expect(mockRootElement.style.setProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-5',
        String(DEFAULT_SETTINGS.opacity_5)
      );
      expect(mockRootElement.style.setProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity',
        String(DEFAULT_SETTINGS.opacity)
      );

      // Verify the correct number of calls
      expect(mockRootElement.style.setProperty).toHaveBeenCalledTimes(6);
    });

    test('uses custom opacity values from settings', () => {
      // Set custom opacity values
      plugin.settings.opacity_1 = 0.9;
      plugin.settings.opacity_2 = 0.8;
      
      plugin.addCSSVariables();

      // Verify the custom values were used
      expect(mockRootElement.style.setProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-1',
        '0.9'
      );
      expect(mockRootElement.style.setProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-2',
        '0.8'
      );
    });
  });

  describe('removeCSSVariables', () => {
    test('removes all opacity CSS variables', () => {
      plugin.removeCSSVariables();

      // Verify each CSS variable was removed
      expect(mockRootElement.style.removeProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-1'
      );
      expect(mockRootElement.style.removeProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-2'
      );
      expect(mockRootElement.style.removeProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-3'
      );
      expect(mockRootElement.style.removeProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-4'
      );
      expect(mockRootElement.style.removeProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity-5'
      );
      expect(mockRootElement.style.removeProperty).toHaveBeenCalledWith(
        '--ghost-fade-focus-opacity'
      );

      // Verify the correct number of calls
      expect(mockRootElement.style.removeProperty).toHaveBeenCalledTimes(6);
    });
  });

  describe('cssVariablesBasedOnEnabledState', () => {
    test('adds CSS variables when enabled is true', () => {
      plugin.settings.enabled = true;
      plugin.cssVariablesBasedOnEnabledState();

      // Should call addCSSVariables
      expect(mockRootElement.style.setProperty).toHaveBeenCalled();
      expect(mockRootElement.style.removeProperty).not.toHaveBeenCalled();
    });

    test('removes CSS variables when enabled is false', () => {
      plugin.settings.enabled = false;
      plugin.cssVariablesBasedOnEnabledState();

      // Should call removeCSSVariables
      expect(mockRootElement.style.removeProperty).toHaveBeenCalled();
      expect(mockRootElement.style.setProperty).not.toHaveBeenCalled();
    });
  });
}); 