import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { useEffect, forwardRef, useImperativeHandle, useCallback, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface JournalTiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  skinStyles?: {
    editorPaperBg?: string;
    text?: string;
    mutedText?: string;
  };
  fontFamily?: string;
  fontSize?: number;
}

export interface TiptapEditorRef {
  editor: ReturnType<typeof useEditor> | null;
}

export const JournalTiptapEditor = forwardRef<TiptapEditorRef, JournalTiptapEditorProps>(
  ({ content, onChange, skinStyles }, ref) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [resizingImage, setResizingImage] = useState<HTMLImageElement | null>(null);
    
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          strike: false,
        }),
        TextStyle,
        FontFamily,
        Color,
        Highlight.configure({ multicolor: true }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            if (node.type.name === "heading") return "";
            return "Write your thoughts here...";
          },
        }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Underline,
        TaskList,
        TaskItem.configure({ nested: true }),
        Link.configure({ openOnClick: false }),
        Image.configure({ inline: true }),
      ],
      content: content ? JSON.parse(content) : undefined,
      onUpdate: ({ editor }) => {
        onChange(JSON.stringify(editor.getJSON()));
      },
      editorProps: {
        handleKeyDown: (view, event) => {
          const editorInstance = view.state;
          
          // Tab for list indent
          if (event.key === 'Tab' && !event.shiftKey) {
            const { $from } = editorInstance.selection;
            const listItem = $from.node(-1);
            if (listItem?.type.name === 'listItem' || listItem?.type.name === 'taskItem') {
              event.preventDefault();
              // Use the editor commands through the view
              const tr = view.state.tr;
              view.dispatch(tr);
              return true;
            }
          }
          
          // Shift+Tab for list outdent
          if (event.key === 'Tab' && event.shiftKey) {
            const { $from } = editorInstance.selection;
            const listItem = $from.node(-1);
            if (listItem?.type.name === 'listItem' || listItem?.type.name === 'taskItem') {
              event.preventDefault();
              return true;
            }
          }
          
          return false;
        },
        attributes: {
          class: "prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[200px] h-full px-8 py-6",
        },
      },
    });

    useImperativeHandle(ref, () => ({ editor }));

    useEffect(() => {
      if (editor && content) {
        const currentContent = JSON.stringify(editor.getJSON());
        if (currentContent !== content) {
          editor.commands.setContent(JSON.parse(content));
        }
      }
    }, [content, editor]);

    // Insert image with resize/delete wrapper
    const insertImageWithResize = useCallback((src: string) => {
      if (!editor) return;
      const imgHtml = `<div class="journal-image-wrapper" contenteditable="false" style="position: relative; display: inline-block; max-width: 100%;">
        <img src="${src}" alt="Image" class="journal-image" style="max-width: 100%; height: auto; display: block; cursor: pointer;" />
        <button class="journal-image-delete-btn" style="position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; background: hsl(var(--destructive)); color: white; border: none; border-radius: 50%; cursor: pointer; opacity: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 1;" title="Delete image">×</button>
        <div class="journal-resize-handle" style="position: absolute; right: 0; bottom: 0; width: 12px; height: 12px; background: hsl(var(--primary)); cursor: se-resize; border-radius: 2px; opacity: 0;" />
      </div><br/>`;
      editor.chain().focus().insertContent(imgHtml).run();
      setTimeout(() => setupImageResizing(), 100);
    }, [editor]);

    // Setup image resizing/delete controls
    const setupImageResizing = useCallback(() => {
      if (!editorContainerRef.current) return;
      const wrappers = editorContainerRef.current.querySelectorAll(".journal-image-wrapper");
      wrappers.forEach((wrapper) => {
        if (wrapper.getAttribute('data-resizing-setup')) return;
        wrapper.setAttribute('data-resizing-setup', 'true');
        
        const img = wrapper.querySelector("img") as HTMLImageElement;
        const handle = wrapper.querySelector(".journal-resize-handle") as HTMLDivElement;
        const deleteBtn = wrapper.querySelector(".journal-image-delete-btn") as HTMLButtonElement;
        
        if (!img || !handle) return;
        
        // Show handle and delete button on hover
        wrapper.addEventListener("mouseenter", () => {
          handle.style.opacity = "1";
          if (deleteBtn) deleteBtn.style.opacity = "1";
        });
        wrapper.addEventListener("mouseleave", () => {
          if (!resizingImage) {
            handle.style.opacity = "0";
            if (deleteBtn) deleteBtn.style.opacity = "0";
          }
        });

        // Handle delete button click
        if (deleteBtn) {
          deleteBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            wrapper.remove();
          });
        }
        
        // Handle resize
        handle.addEventListener("mousedown", (e) => {
          e.preventDefault();
          setResizingImage(img);
          const startX = e.clientX;
          const startWidth = img.offsetWidth;
          
          const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.min(
              Math.max(100, startWidth + (moveEvent.clientX - startX)),
              editorContainerRef.current?.offsetWidth || 800
            );
            img.style.width = `${newWidth}px`;
            img.style.height = "auto";
          };
          
          const onMouseUp = () => {
            setResizingImage(null);
            handle.style.opacity = "0";
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };
          
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });
      });
    }, [resizingImage]);

    // Set up image resizing for existing images when content loads
    useEffect(() => {
      if (editorContainerRef.current) {
        setupImageResizing();
      }
    }, [content, setupImageResizing]);

    return (
    <div
      ref={editorContainerRef}
      className={cn("rounded-xl border border-border/50 flex-1 min-h-[300px] transition-colors")}
      style={{
          backgroundColor: skinStyles?.editorPaperBg || "hsl(var(--card))",
          color: skinStyles?.text || "hsl(var(--foreground))",
        }}
      >
        <EditorContent editor={editor} />
        <style>{`
          .ProseMirror { min-height: 200px; height: 100%; }
          .ProseMirror p.is-editor-empty:first-child::before {
            color: ${skinStyles?.mutedText || "hsl(var(--muted-foreground))"};
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .ProseMirror h1, .ProseMirror h2 { font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
          .ProseMirror h1 { font-size: 1.75em; }
          .ProseMirror h2 { font-size: 1.5em; }
          .ProseMirror p { margin-bottom: 0.75rem; }
          .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
          .ProseMirror ul li { list-style-type: disc; }
          .ProseMirror ol li { list-style-type: decimal; }
          .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
          .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
          .ProseMirror ul[data-type="taskList"] li input { margin-top: 0.25rem; cursor: pointer; }
          .ProseMirror img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; cursor: pointer; }
          .ProseMirror img:hover { outline: 2px solid hsl(var(--primary)); }
          .ProseMirror .journal-image-wrapper { margin: 1rem 0; }
          .ProseMirror .journal-image-wrapper:hover .journal-image-delete-btn,
          .ProseMirror .journal-image-wrapper:hover .journal-resize-handle { opacity: 1 !important; }
          .ProseMirror a { color: hsl(210 60% 50%); text-decoration: underline; }
          .ProseMirror mark { background-color: #fef08a; padding: 0.125em 0; }
        `}</style>
      </div>
    );
  }
);

JournalTiptapEditor.displayName = "JournalTiptapEditor";
