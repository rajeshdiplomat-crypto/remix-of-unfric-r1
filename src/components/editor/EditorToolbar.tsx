import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Undo2, Redo2, Bold, Italic, Underline, Strikethrough, Superscript, Subscript,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, CheckSquare,
  Link2, Image, Paperclip, Palette, Highlighter, RemoveFormatting, Indent, Outdent,
  MoreHorizontal, X
} from 'lucide-react';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { FONT_FAMILIES, FONT_SIZES, TEXT_COLORS, HIGHLIGHT_COLORS } from './types';
import { NotesScribbleCanvas } from '@/components/notes/NotesScribbleCanvas';

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [scribbleOpen, setScribbleOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const getCurrentFontFamily = () => {
    const fontFamily = editor.getAttributes('textStyle').fontFamily;
    const found = FONT_FAMILIES.find(f => f.fontFamily === fontFamily);
    return found?.value || 'sans-serif';
  };

  const getCurrentFontSize = () => {
    return editor.getAttributes('textStyle').fontSize || '16';
  };

  const handleFontFamilyChange = (value: string) => {
    const font = FONT_FAMILIES.find(f => f.value === value);
    if (font) {
      editor.chain().focus().setFontFamily(font.fontFamily).run();
    }
  };

  const handleFontSizeChange = (size: string) => {
    editor.chain().focus().setFontSize(size).run();
  };

  const handleTextColor = (color: string) => {
    if (color) {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().unsetColor().run();
    }
  };

  const handleHighlight = (color: string) => {
    if (color) {
      editor.chain().focus().setHighlight({ color }).run();
    } else {
      editor.chain().focus().unsetHighlight().run();
    }
  };

  const handleInsertLink = () => {
    if (!linkUrl) return;
    const text = linkText || linkUrl;
    
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank">${text}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl, target: '_blank' }).run();
    }
    
    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleInsertImage = () => {
    if (!imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageDialogOpen(false);
    setImageUrl('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      editor.chain().focus().setImage({ src: dataUrl }).run();
    };
    reader.readAsDataURL(file);
    setImageDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveScribble = (dataUrl: string) => {
    editor.chain().focus().setImage({ src: dataUrl }).run();
    setScribbleOpen(false);
  };

  const clearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };

  const simplifyFormatting = () => {
    editor.chain().focus().unsetAllMarks().run();
  };

  // Fix: Use onMouseDown to prevent focus stealing, then run command
  const runCommand = (command: () => boolean) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      command();
    };
  };

  const ToolButton = ({ 
    onMouseDown, 
    active, 
    disabled, 
    children, 
    tooltip 
  }: { 
    onMouseDown: (e: React.MouseEvent) => void; 
    active?: boolean; 
    disabled?: boolean; 
    children: React.ReactNode; 
    tooltip: string;
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-150",
              "hover:bg-muted/60 hover:-translate-y-0.5",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0",
              active && "bg-primary/10 text-primary shadow-sm"
            )}
            onMouseDown={onMouseDown}
            disabled={disabled}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs font-normal">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const Divider = () => (
    <div className="w-px h-6 mx-2 bg-gradient-to-b from-transparent via-border/50 to-transparent" />
  );

  const ToolGroup = ({ children, label }: { children: React.ReactNode; label?: string }) => (
    <div className="flex items-center gap-0.5">
      {children}
    </div>
  );

  return (
    <div className="flex items-center gap-1 flex-wrap py-1">
      {/* History */}
      <ToolGroup>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().undo().run())}
          disabled={!editor.can().undo()}
          tooltip="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().redo().run())}
          disabled={!editor.can().redo()}
          tooltip="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </ToolButton>
      </ToolGroup>

      <Divider />

      {/* Typography */}
      <ToolGroup>
        <Select value={getCurrentFontFamily()} onValueChange={handleFontFamilyChange}>
          <SelectTrigger className="w-28 h-9 text-xs border-none bg-transparent hover:bg-muted/60 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((font) => (
              <SelectItem 
                key={font.value} 
                value={font.value}
                style={{ fontFamily: font.fontFamily }}
              >
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={getCurrentFontSize()} onValueChange={handleFontSizeChange}>
          <SelectTrigger className="w-16 h-9 text-xs border-none bg-transparent hover:bg-muted/60 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size} value={size}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ToolGroup>

      <Divider />

      {/* Inline Formatting */}
      <ToolGroup>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().toggleBold().run())}
          active={editor.isActive('bold')}
          tooltip="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().toggleItalic().run())}
          active={editor.isActive('italic')}
          tooltip="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().toggleUnderline().run())}
          active={editor.isActive('underline')}
          tooltip="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().toggleStrike().run())}
          active={editor.isActive('strike')}
          tooltip="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolButton>
      </ToolGroup>

      <Divider />

      {/* Colors */}
      <ToolGroup>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-all duration-150 hover:-translate-y-0.5"
            >
              <Palette className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-2">Text Color</p>
            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value || 'default'}
                  onClick={() => handleTextColor(color.value)}
                  className={cn(
                    'h-7 w-7 rounded-lg border border-border/50 hover:scale-110 transition-all duration-150 hover:shadow-md',
                    !color.value && 'bg-foreground'
                  )}
                  style={{ backgroundColor: color.value || undefined }}
                  title={color.label}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-all duration-150 hover:-translate-y-0.5"
            >
              <Highlighter className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-2">Highlight</p>
            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value || 'none'}
                  onClick={() => handleHighlight(color.value)}
                  className={cn(
                    'h-7 w-7 rounded-lg border border-border/50 hover:scale-110 transition-all duration-150 hover:shadow-md',
                    !color.value && 'bg-background relative after:absolute after:inset-0 after:bg-[linear-gradient(45deg,transparent_45%,hsl(var(--destructive))_45%,hsl(var(--destructive))_55%,transparent_55%)]'
                  )}
                  style={{ backgroundColor: color.value || undefined }}
                  title={color.label}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </ToolGroup>

      <Divider />

      {/* Lists */}
      <ToolGroup>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().toggleBulletList().run())}
          active={editor.isActive('bulletList')}
          tooltip="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().toggleOrderedList().run())}
          active={editor.isActive('orderedList')}
          tooltip="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().toggleTaskList().run())}
          active={editor.isActive('taskList')}
          tooltip="Checklist"
        >
          <CheckSquare className="h-4 w-4" />
        </ToolButton>
      </ToolGroup>

      <Divider />

      {/* Alignment */}
      <ToolGroup>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().setTextAlign('left').run())}
          active={editor.isActive({ textAlign: 'left' })}
          tooltip="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().setTextAlign('center').run())}
          active={editor.isActive({ textAlign: 'center' })}
          tooltip="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onMouseDown={runCommand(() => editor.chain().focus().setTextAlign('right').run())}
          active={editor.isActive({ textAlign: 'right' })}
          tooltip="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolButton>
      </ToolGroup>

      <Divider />

      {/* Indent/Outdent */}
      <ToolGroup>
        <ToolButton
          onMouseDown={runCommand(() => {
            if (editor.isActive('listItem')) {
              return editor.chain().focus().sinkListItem('listItem').run();
            }
            return false;
          })}
          disabled={!editor.isActive('listItem')}
          tooltip="Indent (Tab)"
        >
          <Indent className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onMouseDown={runCommand(() => {
            if (editor.isActive('listItem')) {
              return editor.chain().focus().liftListItem('listItem').run();
            }
            return false;
          })}
          disabled={!editor.isActive('listItem')}
          tooltip="Outdent (Shift+Tab)"
        >
          <Outdent className="h-4 w-4" />
        </ToolButton>
      </ToolGroup>

      <Divider />

      {/* Media */}
      <ToolGroup>
        <ToolButton
          onMouseDown={(e) => {
            e.preventDefault();
            setLinkDialogOpen(true);
          }}
          active={editor.isActive('link')}
          tooltip="Insert Link"
        >
          <Link2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onMouseDown={(e) => {
            e.preventDefault();
            setImageDialogOpen(true);
          }}
          tooltip="Insert Image"
        >
          <Image className="h-4 w-4" />
        </ToolButton>
      </ToolGroup>

      <Divider />

      {/* More Menu */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-all duration-150 hover:-translate-y-0.5"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1.5" align="start">
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-9 font-normal"
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
            >
              <Superscript className="h-4 w-4" />
              Superscript
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-9 font-normal"
              onClick={() => editor.chain().focus().toggleSubscript().run()}
            >
              <Subscript className="h-4 w-4" />
              Subscript
            </Button>
            <div className="h-px bg-border/50 my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-9 font-normal"
              onClick={simplifyFormatting}
            >
              <RemoveFormatting className="h-4 w-4" />
              Simplify Formatting
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-9 font-normal text-destructive hover:text-destructive"
              onClick={clearFormatting}
            >
              <X className="h-4 w-4" />
              Remove All Formatting
            </Button>
            <div className="h-px bg-border/50 my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-9 font-normal"
              onClick={() => setScribbleOpen(true)}
            >
              <Paperclip className="h-4 w-4" />
              Draw / Scribble
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">URL</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Display Text (optional)</label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleInsertLink} disabled={!linkUrl}>
                Insert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Image URL</label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">or</div>
            <div>
              <label className="text-sm font-medium mb-2 block">Upload Image</label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setImageDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleInsertImage} disabled={!imageUrl}>
                Insert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scribble Canvas */}
      <NotesScribbleCanvas
        open={scribbleOpen}
        onOpenChange={setScribbleOpen}
        onSave={handleSaveScribble}
      />
    </div>
  );
}
