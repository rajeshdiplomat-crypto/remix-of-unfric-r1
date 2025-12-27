import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

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
  ({ content, onChange, skinStyles, fontFamily = "Inter", fontSize = 16 }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
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
        attributes: {
          class: "prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[400px] px-8 py-6",
          style: `font-family: ${fontFamily}, sans-serif; font-size: ${fontSize}px;`,
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

    useEffect(() => {
      if (editor) {
        editor.view.dom.style.fontFamily = `${fontFamily}, sans-serif`;
        editor.view.dom.style.fontSize = `${fontSize}px`;
      }
    }, [fontFamily, fontSize, editor]);

    return (
      <div
        className={cn("rounded-lg border border-border/50 min-h-[500px] transition-colors")}
        style={{
          backgroundColor: skinStyles?.editorPaperBg || "hsl(var(--card))",
          color: skinStyles?.text || "hsl(var(--foreground))",
        }}
      >
        <EditorContent editor={editor} />
        <style>{`
          .ProseMirror { min-height: 400px; }
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
          .ProseMirror img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }
          .ProseMirror a { color: hsl(210 60% 50%); text-decoration: underline; }
        `}</style>
      </div>
    );
  }
);

JournalTiptapEditor.displayName = "JournalTiptapEditor";
