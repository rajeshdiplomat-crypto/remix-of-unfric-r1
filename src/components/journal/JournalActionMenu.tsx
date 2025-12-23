import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MoreHorizontal, 
  Share2, 
  Copy, 
  Trash2, 
  Download,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JournalActionMenuProps {
  onDelete?: () => void;
  onDuplicate?: () => void;
  onExport?: (format: "text" | "markdown") => void;
  onShare?: () => void;
  entryDate: string;
  hasEntry: boolean;
}

export function JournalActionMenu({
  onDelete,
  onDuplicate,
  onExport,
  onShare,
  entryDate,
  hasEntry,
}: JournalActionMenuProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Journal Entry - ${entryDate}`,
        text: "Check out my journal entry",
      }).catch(() => {
        // User cancelled or error
      });
    } else {
      setShareDialogOpen(true);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Entry link copied to clipboard" });
    setShareDialogOpen(false);
  };

  const handleDelete = () => {
    onDelete?.();
    setDeleteDialogOpen(false);
    toast({ title: "Entry deleted", description: "Your journal entry has been removed" });
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Share Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="h-8 w-8 p-0 opacity-70 hover:opacity-100 transition-opacity"
          disabled={!hasEntry}
        >
          <Share2 className="h-4 w-4" />
        </Button>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => onDuplicate?.()}
              disabled={!hasEntry}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Duplicate entry
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onExport?.("text")}
              disabled={!hasEntry}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Export as text
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onExport?.("markdown")}
              disabled={!hasEntry}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export as markdown
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setDeleteDialogOpen(true)}
              disabled={!hasEntry}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete entry
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this entry?</DialogTitle>
            <DialogDescription>
              This will permanently delete your journal entry for {entryDate}. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog (fallback for browsers without Web Share API) */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this entry</DialogTitle>
            <DialogDescription>
              Copy the link to share your journal entry.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border"
            />
            <Button onClick={handleCopyLink}>
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
