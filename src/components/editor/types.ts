export interface EditorContent {
  contentRich: string;
  plainText: string;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export interface EvernoteToolbarEditorProps {
  initialContentRich?: string;
  onContentChange?: (data: EditorContent) => void;
  onSave?: (data: EditorContent) => void;
  onBlur?: () => void;
  autosaveDebounce?: number;
  saveStatus?: SaveStatus;
  onSaveStatusChange?: (status: SaveStatus) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  /** When true, toolbar uses minimal padding for full-page modes */
  fullWidthToolbar?: boolean;
  /** When true (default), constrains content width for readability */
  contentMaxWidth?: boolean;
}

export interface FontOption {
  value: string;
  label: string;
  fontFamily: string;
}

export interface ColorOption {
  label: string;
  value: string;
}

export const FONT_FAMILIES: FontOption[] = [
  { value: 'sans-serif', label: 'Sans Serif', fontFamily: 'Inter, system-ui, sans-serif' },
  { value: 'serif', label: 'Serif', fontFamily: 'Georgia, "Times New Roman", serif' },
  { value: 'slab-serif', label: 'Slab Serif', fontFamily: 'Rockwell, "Courier New", serif' },
  { value: 'monospace', label: 'Monospace', fontFamily: '"Courier New", Consolas, monospace' },
  { value: 'script', label: 'Script', fontFamily: 'cursive' },
  { value: 'handwritten', label: 'Handwritten', fontFamily: '"Comic Sans MS", cursive' },
];

export const FONT_SIZES = ['12', '14', '15', '16', '18', '20', '24', '28', '32'];

export const TEXT_COLORS: ColorOption[] = [
  { label: 'Default', value: '' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Gray', value: '#6b7280' },
];

export const HIGHLIGHT_COLORS: ColorOption[] = [
  { label: 'None', value: '' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Purple', value: '#e9d5ff' },
  { label: 'Orange', value: '#fed7aa' },
];
