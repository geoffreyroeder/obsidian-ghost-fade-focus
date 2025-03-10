/**
 * Improved CodeMirror API mock based on documentation
 * This provides a more accurate representation of the CodeMirror API used in Obsidian
 */

// @codemirror/view
class EditorView {
  state: any;
  dom: HTMLElement;
  
  constructor(config: any) {
    this.state = config.state || {};
    this.dom = document.createElement('div');
  }
  
  static baseTheme(spec: any): any {
    return {};
  }
  
  dispatch(transaction: any): void {}
  
  get viewport() {
    return { from: 0, to: 100 };
  }
  
  get visibleRanges() {
    return [{ from: 0, to: 100 }];
  }
}

class ViewUpdate {
  view: EditorView;
  docChanged: boolean;
  viewportChanged: boolean;
  selectionSet: boolean;
  
  constructor(view: EditorView) {
    this.view = view;
    this.docChanged = false;
    this.viewportChanged = false;
    this.selectionSet = false;
  }
}

const Decoration = {
  line: (spec: any): any => ({
    spec,
    map: () => Decoration.line(spec),
    eq: () => false
  }),
  mark: (spec: any): any => ({
    spec,
    map: () => Decoration.mark(spec),
    eq: () => false
  })
};

const ViewPlugin = {
  fromClass: (cls: any, spec: any): any => ({
    class: cls,
    spec
  }),
  define: (create: Function, spec: any): any => ({
    create,
    spec
  })
};

interface DecorationSet {}

// @codemirror/state
// Renamed from Text to DocText to avoid conflict with DOM's Text
class DocText {
  length: number;
  lines: number;
  
  constructor(text: string = "") {
    this.length = text.length;
    this.lines = text.split('\n').length;
  }
  
  line(n: number): { text: string, from: number, to: number, number: number } {
    return {
      text: "",
      from: 0,
      to: 0,
      number: n
    };
  }
  
  lineAt(pos: number): { text: string, from: number, to: number, number: number } {
    return {
      text: "",
      from: 0,
      to: 0,
      number: 0
    };
  }
}

class EditorState {
  doc: DocText;
  selection: { main: { head: number, anchor: number } };
  
  constructor(config: any = {}) {
    this.doc = new DocText(config.doc || "");
    this.selection = {
      main: { head: 0, anchor: 0 }
    };
  }
  
  static create(config: any): EditorState {
    return new EditorState(config);
  }
}

class RangeSetBuilder {
  constructor() {}
  
  add(from: number, to: number, value: any): void {}
  
  finish(): any {
    return {};
  }
}

// Create a concrete Extension object instead of just a type
const Extension = {
  none: {},
  of: (ext: any) => ext
};

// Export the mocks with proper structure
const view = {
  EditorView,
  Decoration,
  ViewPlugin,
  ViewUpdate,
  DecorationSet: {}
};

const state = {
  EditorState,
  Text: DocText, // Export DocText as Text
  RangeSetBuilder,
  Extension
};

module.exports = {
  view,
  state
}; 