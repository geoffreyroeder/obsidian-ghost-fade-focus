# Ghost Fade Focus Plugin for Obsidian

## Description
Ghost Fade Focus is an Obsidian plugin that provides a focus mode by fading text based on its distance from the cursor. This creates a natural reading experience where the current line and surrounding context remain visible while the rest of the document fades into the background.

## Core Functionality
- Applies opacity-based fading to text lines based on their distance from the cursor
- Ignores empty lines when calculating distances for a more natural reading experience
- Applies consistent fading to both text content and line numbers
- Provides customizable opacity levels through settings
- Includes debug mode for troubleshooting

## Technical Architecture

### Directory Structure
```
obsidian-ghost-fade-focus/
├── src/
│   ├── main.ts                 # Plugin entry point and lifecycle management
│   ├── document-analysis.ts    # Line extraction and distance calculations
│   ├── decorations.ts          # View plugin and decoration management
│   ├── dom-utils.ts            # DOM manipulation and styling
│   ├── debug.ts                # Debugging utilities
│   ├── settings.ts             # Settings interface and UI
│   └── test/                   # Test files
│       ├── line-number-fading.test.ts
│       ├── empty-line-handling.test.ts
│       ├── decoration-logic.test.ts
│       ├── css-variables.test.ts
│       ├── settings.test.ts
│       ├── main.test.ts
│       └── utils.test.ts
├── styles.css                  # CSS styles for the plugin
├── manifest.json               # Plugin manifest
├── package.json                # NPM package configuration
├── tsconfig.json               # TypeScript configuration
└── .notes/                     # Project documentation
    ├── project_overview.md     # This file
    ├── task_list.md            # Current tasks and priorities
    ├── implementation_log.md   # Record of implementation changes
    └── til.md                  # Technical insights gained during development
```

### Module Responsibilities

- **main.ts**: Plugin class definition, lifecycle methods, and coordination
- **document-analysis.ts**: Handles document processing, line extraction, and distance calculations
- **decorations.ts**: Manages view plugin creation and decoration management
- **dom-utils.ts**: Handles DOM interactions, CSS variables, and line number styling
- **debug.ts**: Contains debugging utilities and logging functions
- **settings.ts**: Defines settings interface, default values, and settings UI

### Data Flow
1. The plugin initializes and registers editor extensions
2. When the cursor moves or document changes:
   - Visible lines are extracted from the document
   - Distances from cursor are calculated, ignoring empty lines
   - Decorations are applied to text lines based on distance
   - Line numbers are styled with corresponding opacity classes
3. Settings changes update CSS variables and trigger reapplication of decorations

## Dependencies
- Obsidian API
- CodeMirror 6 (via Obsidian)
- TypeScript
- Jest (for testing)

## Testing Strategy
The plugin uses Jest for unit testing with a focus on testing actual implementations rather than mocks. Key test areas include:
- Empty line handling
- Distance calculation
- Line number fading
- CSS variable management
- Settings functionality 