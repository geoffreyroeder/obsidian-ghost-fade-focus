# Ghost Fade Focus Plugin - Project Overview

## Description
The Ghost Fade Focus plugin for Obsidian provides a focus mode that fades text based on its distance from the cursor position. The key innovation is that it ignores empty lines when calculating these distances, creating a more natural focus experience.

## Core Functionality
- Apply varying levels of opacity to text based on distance from cursor
- Ignore empty lines when calculating distance
- Provide user-configurable opacity settings for different distance levels
- Allow toggling the effect on/off via command

## Technical Architecture
- **Main Plugin Class**: Handles plugin lifecycle, settings, and CodeMirror integration
- **Decoration Logic**: Calculates distances and applies CSS classes to lines
  - Specifically designed to ignore empty lines in distance calculations
  - Two-pass algorithm: first calculates effective distances, then applies decorations
- **Settings**: Manages user configuration for opacity levels
- **CSS Variables**: Dynamically applies opacity values based on settings

## Dependencies
- Obsidian API
- CodeMirror 6 