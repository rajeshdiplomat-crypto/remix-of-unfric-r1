import { useState, useMemo } from "react";
import { FileText, Search, Plus, FolderOpen, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface NotesMindMapViewProps {
  groups: NoteGroup[];
  folders: NoteFolder[];
  notes: Note[];
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
  onAddNote: (groupId: string, folderId: string | null) => void;
  onAddFolder: (groupId: string, folderName: string) => void;
}

export function NotesMindMapView({
  groups,
  folders,
  notes,
  selectedNoteId,
  onNoteClick,
  onAddNote,
  onAddFolder,
}: NotesMindMapViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<NoteGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  const totalNotes = notes.length;

  // Calculate positions for groups in a circular ring
  const groupPositions = useMemo(() => {
    const count = sortedGroups.length;
    const radius = 180;
    const centerX = 300;
    const centerY = 250;

    return sortedGroups.map((group, index) => {
      const angle = (index * 2 * Math.PI / count) - Math.PI / 2;
      return {
        group,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        angle,
      };
    });
  }, [sortedGroups]);

  // Get folders and notes for selected group
  const selectedGroupFolders = useMemo(() => {
    if (!selectedGroup) return [];
    return folders.filter(f => f.groupId === selectedGroup.id);
  }, [selectedGroup, folders]);

  const selectedGroupNotes = useMemo(() => {
    if (!selectedGroup) return [];
    const groupNotes = notes.filter(n => n.groupId === selectedGroup.id);
    if (searchQuery) {
      return groupNotes.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.plainText?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return groupNotes;
  }, [selectedGroup, notes, searchQuery]);

  const getNotesForFolder = (folderId: string) => {
    return notes.filter(n => n.folderId === folderId);
  };

  const getDirectNotes = () => {
    if (!selectedGroup) return [];
    return notes.filter(n => n.groupId === selectedGroup.id && !n.folderId);
  };

  const handleAddNewNote = () => {
    if (selectedGroup) {
      onAddNote(selectedGroup.id, null);
    }
  };

  const handleAddNewSection = () => {
    if (selectedGroup) {
      onAddFolder(selectedGroup.id, "New Section");
    }
  };

  return (
    <div className="relative w-full h-[650px] flex">
      {/* Mind Map Canvas */}
      <div 
        className={cn(
          "relative flex-1 overflow-hidden transition-all duration-300",
          selectedGroup ? "mr-[380px]" : ""
        )}
      >
        {/* Dotted Background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* SVG for connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {groupPositions.map(({ group, x, y }) => (
            <line
              key={`line-${group.id}`}
              x1={300}
              y1={250}
              x2={x}
              y2={y}
              stroke={selectedGroup?.id === group.id ? group.color : "hsl(var(--muted-foreground))"}
              strokeWidth={selectedGroup?.id === group.id ? 2 : 1}
              strokeOpacity={selectedGroup?.id === group.id ? 0.8 : 0.3}
              className="transition-all duration-300"
            />
          ))}
        </svg>

        {/* Center Node */}
        <div 
          className="absolute"
          style={{
            left: 300,
            top: 250,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-primary/30 flex items-center justify-center shadow-lg">
            <div className="text-center">
              <span className="text-base font-bold text-foreground">Notes</span>
              <span className="block text-xs text-muted-foreground">{totalNotes} total</span>
            </div>
          </div>
        </div>

        {/* Group Nodes */}
        {groupPositions.map(({ group, x, y }) => {
          const groupNotes = notes.filter(n => n.groupId === group.id);
          const isSelected = selectedGroup?.id === group.id;

          return (
            <div
              key={group.id}
              className="absolute cursor-pointer transition-all duration-300"
              style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 20 : 10,
              }}
              onClick={() => setSelectedGroup(isSelected ? null : group)}
            >
              <div 
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border bg-card/95 backdrop-blur-sm transition-all duration-300",
                  isSelected 
                    ? "border-2 shadow-lg scale-105" 
                    : "border-border/50 hover:border-border hover:shadow-md"
                )}
                style={{
                  borderColor: isSelected ? group.color : undefined,
                  boxShadow: isSelected ? `0 0 20px ${group.color}40` : undefined,
                }}
              >
                {/* Colored Dot */}
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                {/* Label */}
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {group.name}
                </span>
                {/* Count Badge */}
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {groupNotes.length}
                </span>
              </div>
            </div>
          );
        })}

        {/* Help text */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          Click a section or note to view details
        </div>
      </div>

      {/* Right Side Panel */}
      {selectedGroup && (
        <div className="absolute right-0 top-0 h-full w-[380px] bg-card border-l border-border shadow-lg animate-in slide-in-from-right-5 duration-300">
          <div className="flex flex-col h-full">
            {/* Panel Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Notes</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>Mind Map</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-foreground font-medium">{selectedGroup.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setSelectedGroup(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in this group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Folders/Sections */}
                {selectedGroupFolders.map((folder) => {
                  const folderNotes = getNotesForFolder(folder.id);
                  const recentUpdate = folderNotes.length > 0 
                    ? getMostRecentUpdate(folderNotes) 
                    : null;

                  return (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => {
                        if (folderNotes.length > 0) {
                          onNoteClick(folderNotes[0]);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {folder.name}
                          </p>
                          {recentUpdate && (
                            <p className="text-xs text-muted-foreground">
                              Updated {formatDistanceToNow(new Date(recentUpdate), { addSuffix: false })} ago
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {folderNotes.length}
                      </span>
                    </div>
                  );
                })}

                {/* Direct Notes (not in folders) */}
                {getDirectNotes().map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer",
                      selectedNoteId === note.id 
                        ? "bg-primary/10 border border-primary/20" 
                        : "bg-muted/30 hover:bg-muted/50"
                    )}
                    onClick={() => onNoteClick(note)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {note.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: false })} ago
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedGroupFolders.length === 0 && getDirectNotes().length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notes in this group</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Panel Footer - Actions */}
            <div className="p-4 border-t border-border space-y-2">
              <Button 
                className="w-full gap-2" 
                size="sm"
                onClick={handleAddNewNote}
              >
                <Plus className="h-4 w-4" />
                New Note
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2" 
                size="sm"
                onClick={handleAddNewSection}
              >
                <FolderOpen className="h-4 w-4" />
                New Section
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
