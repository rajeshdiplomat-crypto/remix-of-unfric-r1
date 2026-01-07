import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { EditorToolbar } from './EditorToolbar';
import { FontSize } from './extensions/FontSize';
import type { EvernoteToolbarEditorProps, SaveStatus } from './types';
import type { Editor } from '@tiptap/react';

export interface EvernoteToolbarEditorRef {
  editor: Editor | null;
  getHTML: () => string;
  getText: () => string;
}

export const EvernoteToolbarEditor = forwardRef<EvernoteToolbarEditorRef, EvernoteToolbarEditorProps>(
  (
    {
      initialContentRich = '',
      onContentChange,
      onSave,
      onBlur,
      autosaveDebounce = 1500,
      saveStatus,
      onSaveStatusChange,
      placeholder = 'Start typing...',
      className,
      readOnly = false,
    },
    ref
  ) => {
    const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedContentRef = useRef<string>(initialContentRich);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-primary underline cursor-pointer',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        }),
        Image.configure({
          inline: true,
          allowBase64: true,
          HTMLAttributes: {
            class: 'max-w-full h-auto rounded cursor-pointer',
          },
        }),
        TaskList.configure({
          HTMLAttributes: {
            class: 'not-prose',
          },
        }),
        TaskItem.configure({
          nested: true,
          HTMLAttributes: {
            class: 'flex items-start gap-2',
          },
        }),
        TextStyle,
        Color,
        Highlight.configure({
          multicolor: true,
        }),
        FontFamily,
        FontSize,
        Subscript,
        Superscript,
      ],
      content: initialContentRich,
      editable: !readOnly,
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm max-w-none focus:outline-none min-h-[300px] text-foreground',
            '[&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:my-1',
            '[&_ul_ul]:list-circle [&_ol_ol]:list-lower-alpha',
            '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:ml-0',
            '[&_ul[data-type="taskList"]_li]:flex [&_ul[data-type="taskList"]_li]:items-start [&_ul[data-type="taskList"]_li]:gap-2',
            '[&_ul[data-type="taskList"]_li_label]:flex [&_ul[data-type="taskList"]_li_label]:items-center',
            '[&_ul[data-type="taskList"]_li_label_input]:mr-2 [&_ul[data-type="taskList"]_li_label_input]:h-4 [&_ul[data-type="taskList"]_li_label_input]:w-4',
            '[&_a]:text-primary [&_a]:underline',
            '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded',
            '[&_p]:my-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4',
            '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-3',
            '[&_h3]:text-lg [&_h3]:font-medium [&_h3]:my-2'
          ),
        },
        handleKeyDown: (view, event) => {
          // Handle Tab for list nesting
          if (event.key === 'Tab' && !event.shiftKey) {
            const { state } = view;
            const { $from } = state.selection;
            const node = $from.node(-1);
            if (node?.type.name === 'listItem' || node?.type.name === 'taskItem') {
              event.preventDefault();
              editor?.chain().focus().sinkListItem('listItem').run() ||
              editor?.chain().focus().sinkListItem('taskItem').run();
              return true;
            }
          }
          if (event.key === 'Tab' && event.shiftKey) {
            const { state } = view;
            const { $from } = state.selection;
            const node = $from.node(-1);
            if (node?.type.name === 'listItem' || node?.type.name === 'taskItem') {
              event.preventDefault();
              editor?.chain().focus().liftListItem('listItem').run() ||
              editor?.chain().focus().liftListItem('taskItem').run();
              return true;
            }
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const text = editor.getText();

        onContentChange?.({ contentRich: html, plainText: text });

        // Mark as unsaved
        if (html !== lastSavedContentRef.current) {
          onSaveStatusChange?.('unsaved');
        }

        // Debounced autosave
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }

        autosaveTimerRef.current = setTimeout(() => {
          if (html !== lastSavedContentRef.current) {
            onSaveStatusChange?.('saving');
            onSave?.({ contentRich: html, plainText: text });
            lastSavedContentRef.current = html;
            setTimeout(() => onSaveStatusChange?.('saved'), 300);
          }
        }, autosaveDebounce);
      },
      onBlur: ({ editor }) => {
        // Save on blur
        const html = editor.getHTML();
        const text = editor.getText();

        if (html !== lastSavedContentRef.current) {
          onSaveStatusChange?.('saving');
          onSave?.({ contentRich: html, plainText: text });
          lastSavedContentRef.current = html;
          setTimeout(() => onSaveStatusChange?.('saved'), 300);
        }

        onBlur?.();
      },
    });

    // Expose editor methods via ref
    useImperativeHandle(ref, () => ({
      editor,
      getHTML: () => editor?.getHTML() || '',
      getText: () => editor?.getText() || '',
    }));

    // Update content when initialContentRich changes (e.g., switching notes)
    useEffect(() => {
      if (editor && initialContentRich !== editor.getHTML()) {
        editor.commands.setContent(initialContentRich);
        lastSavedContentRef.current = initialContentRich;
      }
    }, [initialContentRich, editor]);

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }
      };
    }, []);

    // Handle paste for images
    useEffect(() => {
      if (!editor) return;

      const handlePaste = (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                editor.chain().focus().setImage({ src: dataUrl }).run();
              };
              reader.readAsDataURL(file);
            }
            break;
          }
        }
      };

      const editorElement = document.querySelector('.ProseMirror');
      editorElement?.addEventListener('paste', handlePaste as EventListener);

      return () => {
        editorElement?.removeEventListener('paste', handlePaste as EventListener);
      };
    }, [editor]);

    return (
      <div className={cn('flex flex-col', className)}>
        {/* Toolbar */}
        <div className="border-b border-border/30 px-4 py-2">
          <EditorToolbar editor={editor} />
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto px-4 py-4">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);

EvernoteToolbarEditor.displayName = 'EvernoteToolbarEditor';
