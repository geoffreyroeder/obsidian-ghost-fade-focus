# Key Decisions

## 2024-03-10: Testing Approach for Obsidian Plugins

### Decision
Created a modular testing approach using Jest with specialized mocks for Obsidian and CodeMirror APIs.

### Rationale
- Obsidian plugins rely on external APIs not available in test environments
- Direct testing of the plugin would require a running Obsidian instance
- Mocking allows us to isolate and test core plugin logic independently

### Implementation Details
- Created `__mocks__/obsidian.ts` with accurate API simulation
- Created `__mocks__/codemirror.ts` to mock view and state modules
- Used isolated testing for utility functions
- Implemented self-contained tests for decoration logic

### Consequences
- Tests can run without a live Obsidian instance
- Core plugin functionality can be verified automatically
- Some integration aspects still require manual testing

## 2024-03-10: Empty Line Handling in Ghost Fade Focus

### Decision
Implement improved empty line handling in the decoration logic to create a more intuitive focus experience by ignoring empty lines when calculating distances.

### Rationale
- Empty lines visually separate content but don't contain meaningful text to focus on
- Including empty lines in distance calculations creates inconsistent visual experience
- Ignoring empty lines provides more predictable and useful fading effect
- Current implementation counts all lines equally regardless of content

### Implementation Details
- Use existing `isEmptyLine` function to detect empty or whitespace-only lines
- Modify the distance calculation algorithm to skip empty lines
- Calculate effective distances based only on non-empty content lines
- Apply decorations only to non-empty lines based on their effective distances
- Leave empty lines without special decoration (default editor styling)

### Consequences
- More intuitive visual experience as fading applies consistently to content
- Two paragraphs separated by multiple empty lines will have consecutive distance values
- Edge cases like documents with only empty lines or cursor on empty line handled gracefully
- Minimal performance impact as line content is already being processed 