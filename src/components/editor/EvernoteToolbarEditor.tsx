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
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';
import { EditorToolbar } from './EditorToolbar';
import { ImageControlsOverlay } from './ImageControlsOverlay';
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
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

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
            class: 'max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity',
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
            '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:cursor-pointer',
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
          // Handle Delete/Backspace for selected image
          if ((event.key === 'Delete' || event.key === 'Backspace') && selectedImage) {
            event.preventDefault();
            deleteSelectedImage();
            return true;
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

    // Delete selected image
    const deleteSelectedImage = () => {
      if (!selectedImage || !editor) return;
      
      try {
        const pos = editor.view.posAtDOM(selectedImage, 0);
        editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
      } catch {
        // Fallback: find and delete the image node
        selectedImage.remove();
        // Trigger content update
        if (editor) {
          const html = editor.getHTML();
          const text = editor.getText();
          onContentChange?.({ contentRich: html, plainText: text });
        }
      }
      setSelectedImage(null);
    };

    // Handle image resize
    const handleImageResize = (newWidth: number) => {
      if (!selectedImage) return;
      selectedImage.style.width = `${newWidth}px`;
      selectedImage.style.height = 'auto';
      
      // Trigger content change for autosave
      if (editor) {
        const html = editor.getHTML();
        const text = editor.getText();
        onContentChange?.({ contentRich: html, plainText: text });
        onSaveStatusChange?.('unsaved');
      }
    };

    // Image click selection
    useEffect(() => {
      if (!editor || !editorContainerRef.current) return;

      const container = editorContainerRef.current;

      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // Check if clicked on image
        if (target.tagName === 'IMG') {
          e.preventDefault();
          e.stopPropagation();
          setSelectedImage(target as HTMLImageElement);
        } else if (!target.closest('.image-controls-overlay')) {
          // Clicked outside image and not on controls
          setSelectedImage(null);
        }
      };

      container.addEventListener('click', handleClick);
      return () => container.removeEventListener('click', handleClick);
    }, [editor]);

    // Deselect image on editor focus
    useEffect(() => {
      if (!editor) return;

      const handleFocus = () => {
        // Don't deselect if clicking inside the editor on an image
      };

      editor.on('focus', handleFocus);
      return () => {
        editor.off('focus', handleFocus);
      };
    }, [editor]);

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
        setSelectedImage(null);
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
      <div className={cn('flex flex-col h-full', className)}>
        {/* Toolbar - Full width with glassmorphism */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-6 py-3">
          <EditorToolbar editor={editor} />
        </div>

        {/* Editor Content */}
        <div 
          ref={editorContainerRef} 
          className="flex-1 overflow-auto px-6 py-6 relative"
        >
          <EditorContent editor={editor} className="max-w-none" />
          
          {/* Image Controls Overlay */}
          {selectedImage && editorContainerRef.current && (
            <ImageControlsOverlay
              image={selectedImage}
              onDelete={deleteSelectedImage}
              onResize={handleImageResize}
              containerRef={editorContainerRef}
            />
          )}
        </div>
      </div>
    );
  }
);

EvernoteToolbarEditor.displayName = 'EvernoteToolbarEditor';
