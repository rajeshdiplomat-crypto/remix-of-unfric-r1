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

  const ToolButton = ({ 
    onClick, 
    active, 
    disabled, 
    children, 
    tooltip 
  }: { 
    onClick: () => void; 
    active?: boolean; 
    disabled?: boolean; 
    children: React.ReactNode; 
    tooltip: string;
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={active ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={onClick}
            disabled={disabled}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const Divider = () => <div className="w-px h-6 bg-border mx-1" />;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* History */}
      <ToolButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        tooltip="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        tooltip="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* Font Family */}
      <Select value={getCurrentFontFamily()} onValueChange={handleFontFamilyChange}>
        <SelectTrigger className="w-28 h-8 text-xs">
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

      {/* Font Size */}
      <Select value={getCurrentFontSize()} onValueChange={handleFontSizeChange}>
        <SelectTrigger className="w-16 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((size) => (
            <SelectItem key={size} value={size}>{size}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Divider />

      {/* Inline Formatting */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        tooltip="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        tooltip="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        tooltip="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* Colors */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex flex-wrap gap-1 max-w-[180px]">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.value || 'default'}
                onClick={() => handleTextColor(color.value)}
                className={cn(
                  'h-6 w-6 rounded border border-border/50 hover:scale-110 transition-transform',
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
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Highlighter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex flex-wrap gap-1 max-w-[180px]">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value || 'none'}
                onClick={() => handleHighlight(color.value)}
                className={cn(
                  'h-6 w-6 rounded border border-border/50 hover:scale-110 transition-transform',
                  !color.value && 'bg-background relative after:absolute after:inset-0 after:bg-[linear-gradient(45deg,transparent_45%,hsl(var(--destructive))_45%,hsl(var(--destructive))_55%,transparent_55%)]'
                )}
                style={{ backgroundColor: color.value || undefined }}
                title={color.label}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Divider />

      {/* Lists */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        tooltip="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        tooltip="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive('taskList')}
        tooltip="Checklist"
      >
        <CheckSquare className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* Alignment */}
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        tooltip="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        tooltip="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        tooltip="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* Indent/Outdent */}
      <ToolButton
        onClick={() => {
          if (editor.isActive('listItem')) {
            editor.chain().focus().sinkListItem('listItem').run();
          }
        }}
        disabled={!editor.isActive('listItem')}
        tooltip="Indent (Tab)"
      >
        <Indent className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        onClick={() => {
          if (editor.isActive('listItem')) {
            editor.chain().focus().liftListItem('listItem').run();
          }
        }}
        disabled={!editor.isActive('listItem')}
        tooltip="Outdent (Shift+Tab)"
      >
        <Outdent className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* Media */}
      <ToolButton
        onClick={() => setLinkDialogOpen(true)}
        active={editor.isActive('link')}
        tooltip="Insert Link"
      >
        <Link2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        onClick={() => setImageDialogOpen(true)}
        tooltip="Insert Image"
      >
        <Image className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* More Menu */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="start">
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-8"
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-4 w-4" />
              Strikethrough
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-8"
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
            >
              <Superscript className="h-4 w-4" />
              Superscript
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-8"
              onClick={() => editor.chain().focus().toggleSubscript().run()}
            >
              <Subscript className="h-4 w-4" />
              Subscript
            </Button>
            <div className="h-px bg-border my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-8"
              onClick={simplifyFormatting}
            >
              <RemoveFormatting className="h-4 w-4" />
              Simplify Formatting
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-8 text-destructive hover:text-destructive"
              onClick={clearFormatting}
            >
              <X className="h-4 w-4" />
              Remove All Formatting
            </Button>
            <div className="h-px bg-border my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-8"
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
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setImageDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleInsertImage} disabled={!imageUrl}>
                Insert URL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scribble Dialog */}
      <NotesScribbleCanvas
        open={scribbleOpen}
        onOpenChange={setScribbleOpen}
        onSave={handleSaveScribble}
        initialData={null}
      />
    </div>
  );
}
