import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Settings, FolderPlus, FileText, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { NotesSplitView } from "@/components/notes/NotesSplitView";
import { NotesGroupSettings } from "@/components/notes/NotesGroupSettings";
import { NotesFilterPanel, type NotesFilters } from "@/components/notes/NotesFilterPanel";
import { NotesNewNoteDialog } from "@/components/notes/NotesNewNoteDialog";

export interface NoteGroup {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface NoteFolder {
  id: string;
  groupId: string;
  name: string;
  sortOrder: number;
}

export interface Note {
  id: string;
  groupId: string;
  folderId: string | null;
  title: string;
  contentRich: string;
  plainText: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isArchived: boolean;
}

const STORAGE_KEY_GROUPS = "notes-groups";
const STORAGE_KEY_FOLDERS = "notes-folders";
const STORAGE_KEY_NOTES = "notes-data";

const DEFAULT_GROUPS: NoteGroup[] = [
  { id: "work", name: "Work", color: "hsl(221, 83%, 53%)", sortOrder: 0 },
  { id: "personal", name: "Personal", color: "hsl(142, 71%, 45%)", sortOrder: 1 },
  { id: "wellness", name: "Wellness", color: "hsl(262, 83%, 58%)", sortOrder: 2 },
  { id: "hobby", name: "Hobby", color: "hsl(25, 95%, 53%)", sortOrder: 3 },
];

const SAMPLE_NOTES: Note[] = [
  {
    id: "1",
    groupId: "work",
    folderId: null,
    title: "Q4 Marketing Strategy",
    contentRich: "Focus on social media channels and influencer partnerships for launch...",
    plainText: "Focus on social media channels and influencer partnerships for launch. Key Focus Areas: Social Media Channels: Revamp Instagram strategy with more Reels and user-generated content. Experiment with TikTok ads.",
    tags: ["strategy", "marketing"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPinned: false,
    isArchived: false,
  },
  {
    id: "2",
    groupId: "work",
    folderId: null,
    title: "Meeting Notes: Design Sync",
    contentRich: "Action items: Update color palette, review typo...",
    plainText: "Action items: Update color palette, review typography choices",
    tags: ["meeting"],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isPinned: false,
    isArchived: false,
  },
  {
    id: "3",
    groupId: "personal",
    folderId: null,
    title: "Grocery List",
    contentRich: "Milk, eggs, bread, avocados, coffee beans, spi...",
    plainText: "Milk, eggs, bread, avocados, coffee beans, spinach",
    tags: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    isPinned: false,
    isArchived: false,
  },
  {
    id: "4",
    groupId: "personal",
    folderId: null,
    title: "Travel Itinerary: Japan",
    contentRich: "Day 1: Tokyo arrival, Shinjuku dinner. Day 2: Ky...",
    plainText: "Day 1: Tokyo arrival, Shinjuku dinner. Day 2: Kyoto temples",
    tags: ["travel"],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isPinned: false,
    isArchived: false,
  },
  {
    id: "5",
    groupId: "wellness",
    folderId: null,
    title: "Gratitude Journal Draft",
    contentRich: "Today I am grateful for the sunny weather and ...",
    plainText: "Today I am grateful for the sunny weather and morning coffee",
    tags: ["gratitude"],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    isPinned: false,
    isArchived: false,
  },
  {
    id: "6",
    groupId: "hobby",
    folderId: null,
    title: "Book Ideas",
    contentRich: "The Silent Patient, Project Hail Mary, Atomic Ha...",
    plainText: "The Silent Patient, Project Hail Mary, Atomic Habits",
    tags: ["reading"],
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    isPinned: false,
    isArchived: false,
  },
];

type ViewMode = "grid" | "split" | "editor";

export default function Notes() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Load from localStorage or use defaults
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTES);
    return saved ? JSON.parse(saved) : SAMPLE_NOTES;
  });
  
  const [groups, setGroups] = useState<NoteGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GROUPS);
    return saved ? JSON.parse(saved) : DEFAULT_GROUPS;
  });
  
  const [folders, setFolders] = useState<NoteFolder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FOLDERS);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderGroupId, setNewFolderGroupId] = useState("");
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false);
  
  const [filters, setFilters] = useState<NotesFilters>({
    groupId: "all",
    folderId: "all",
    sortBy: "updatedAt",
    sortOrder: "desc",
    tag: "all",
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  }, [notes]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
  }, [groups]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  }, [folders]);

  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  // Filter and sort notes
  const filteredNotes = notes
    .filter((note) => {
      if (note.isArchived) return false;
      
      const matchesGroup = selectedGroup === "all" || note.groupId === selectedGroup;
      const matchesFolder = selectedFolder === null || note.folderId === selectedFolder;
      const matchesFilterGroup = filters.groupId === "all" || note.groupId === filters.groupId;
      const matchesFilterFolder = filters.folderId === "all" || note.folderId === filters.folderId;
      const matchesTag = filters.tag === "all" || note.tags.includes(filters.tag);
      const matchesSearch = searchQuery
        ? note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.plainText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      
      return matchesGroup && matchesFolder && matchesFilterGroup && matchesFilterFolder && matchesTag && matchesSearch;
    })
    .sort((a, b) => {
      if (filters.sortBy === "title") {
        return filters.sortOrder === "asc" 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      const dateA = new Date(a[filters.sortBy]).getTime();
      const dateB = new Date(b[filters.sortBy]).getTime();
      return filters.sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const getNotesByGroup = (groupId: string) => {
    return filteredNotes.filter((note) => note.groupId === groupId);
  };

  const getFoldersByGroup = (groupId: string) => {
    return folders.filter((folder) => folder.groupId === groupId).sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const getGroupColor = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.color || "hsl(215, 20%, 65%)";
  };

  const getGroupName = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.name || "Unknown";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return format(date, "h:mm a");
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const handleOpenNewNoteDialog = () => {
    setNewNoteDialogOpen(true);
  };

  const handleCreateNote = (groupId: string, folderId: string | null, tags: string[]) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      groupId,
      folderId,
      title: "Untitled Note",
      contentRich: "",
      plainText: "",
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      isArchived: false,
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setViewMode("split");
  };

  const handleQuickCreateNote = () => {
    // Quick create without dialog - uses current selection
    const groupId = selectedGroup === "all" ? "work" : selectedGroup;
    handleCreateNote(groupId, selectedFolder, []);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim() || !newFolderGroupId) return;
    
    const newFolder: NoteFolder = {
      id: crypto.randomUUID(),
      groupId: newFolderGroupId,
      name: newFolderName,
      sortOrder: folders.filter((f) => f.groupId === newFolderGroupId).length,
    };
    setFolders([...folders, newFolder]);
    setNewFolderDialogOpen(false);
    setNewFolderName("");
    setNewFolderGroupId("");
    toast({ title: "Folder created", description: `"${newFolderName}" added to ${getGroupName(newFolderGroupId)}` });
  };

  const handleSaveNote = (updatedNote: Note) => {
    setNotes(notes.map((n) => (n.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date().toISOString() } : n)));
    toast({ title: "Note saved" });
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter((n) => n.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setViewMode("grid");
    }
    toast({ title: "Note deleted" });
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setViewMode("split");
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolder(selectedFolder === folderId ? null : folderId);
  };

  const handleBackToGrid = () => {
    setViewMode("grid");
    setSelectedNote(null);
  };

  const handleGroupsChange = (newGroups: NoteGroup[]) => {
    setGroups(newGroups);
  };

  // Sort groups by sortOrder
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  // Grid View (All Notes Overview)
  if (viewMode === "grid") {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">All Notes</h1>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  New note
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenNewNoteDialog}>
                  <FileText className="h-4 w-4 mr-2" />
                  New Note (with options)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleQuickCreateNote}>
                  <FileText className="h-4 w-4 mr-2" />
                  Quick Note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setNewFolderGroupId(selectedGroup === "all" ? "work" : selectedGroup);
                  setNewFolderDialogOpen(true);
                }}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <NotesFilterPanel
              groups={groups}
              folders={folders}
              tags={allTags}
              filters={filters}
              onFiltersChange={setFilters}
            />
            <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Group Filter Chips - scrollable */}
        <ScrollArea className="w-full">
          <div className="flex items-center gap-2 pb-2">
            <Button
              variant={selectedGroup === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedGroup("all");
                setSelectedFolder(null);
              }}
              className="rounded-full shrink-0"
            >
              All
            </Button>
            {sortedGroups.map((group) => (
              <Button
                key={group.id}
                variant={selectedGroup === group.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedGroup(group.id);
                  setSelectedFolder(null);
                }}
                className="rounded-full shrink-0"
                style={{
                  backgroundColor: selectedGroup === group.id ? group.color : undefined,
                  borderColor: selectedGroup === group.id ? group.color : undefined,
                }}
              >
                {group.name}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="pl-10"
          />
        </div>

        {/* Notes Grid by Group - dynamic columns based on group count */}
        <div 
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${Math.max(4, sortedGroups.filter((g) => selectedGroup === "all" || g.id === selectedGroup).length)}, minmax(220px, 1fr))`
          }}
        >
          {sortedGroups.filter((g) => selectedGroup === "all" || g.id === selectedGroup).map((group) => {
            const groupNotes = getNotesByGroup(group.id);
            const groupFolders = getFoldersByGroup(group.id);
            
            return (
              <div key={group.id} className="space-y-3 min-w-0">
                {/* Group Header */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground uppercase tracking-wide">
                    {group.name}
                  </span>
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {groupFolders.length} {groupFolders.length === 1 ? "folder" : "folders"} · {groupNotes.length} {groupNotes.length === 1 ? "note" : "notes"}
                  </span>
                </div>

                {/* Folder and Note Cards */}
                <div className="space-y-3">
                  {/* Folder Cards - displayed like notes */}
                  {groupFolders.map((folder) => (
                    <Card
                      key={folder.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow p-4 ${selectedFolder === folder.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => handleFolderClick(folder.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {selectedFolder === folder.id ? (
                          <FolderOpen className="h-5 w-5" style={{ color: group.color }} />
                        ) : (
                          <Folder className="h-5 w-5" style={{ color: group.color }} />
                        )}
                        <h3 className="font-medium text-foreground text-sm line-clamp-1">
                          {folder.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {notes.filter(n => n.folderId === folder.id).length} notes inside
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0"
                          style={{ backgroundColor: `${group.color}20`, color: group.color }}
                        >
                          Folder
                        </Badge>
                      </div>
                    </Card>
                  ))}

                  {/* Note Cards */}
                  {groupNotes
                    .filter(note => selectedFolder === null || note.folderId === selectedFolder)
                    .slice(0, 4)
                    .map((note) => (
                    <Card
                      key={note.id}
                      className="cursor-pointer hover:shadow-md transition-shadow p-4"
                      onClick={() => handleNoteClick(note)}
                    >
                      <h3 className="font-medium text-foreground text-sm mb-1 line-clamp-1">
                        {note.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {note.plainText}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(note.updatedAt)}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0"
                          style={{ backgroundColor: `${group.color}20`, color: group.color }}
                        >
                          {group.name}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* New Note Dialog */}
        <NotesNewNoteDialog
          open={newNoteDialogOpen}
          onOpenChange={setNewNoteDialogOpen}
          groups={groups}
          folders={folders}
          defaultGroupId={selectedGroup === "all" ? undefined : selectedGroup}
          defaultFolderId={selectedFolder}
          onCreate={handleCreateNote}
        />

        {/* New Folder Dialog */}
        <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Folder Name</label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Group</label>
                <div className="flex flex-wrap gap-2">
                  {groups.map((group) => (
                    <Button
                      key={group.id}
                      variant={newFolderGroupId === group.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewFolderGroupId(group.id)}
                      style={{
                        backgroundColor: newFolderGroupId === group.id ? group.color : undefined,
                      }}
                    >
                      {group.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setNewFolderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCreateFolder} disabled={!newFolderName.trim() || !newFolderGroupId}>
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <NotesGroupSettings
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          groups={groups}
          onGroupsChange={handleGroupsChange}
          folders={folders}
          onFoldersChange={setFolders}
        />
      </div>
    );
  }

  // Split View
  return (
    <NotesSplitView
      notes={filteredNotes}
      groups={groups}
      folders={folders}
      selectedNote={selectedNote}
      onSelectNote={setSelectedNote}
      onSaveNote={handleSaveNote}
      onDeleteNote={handleDeleteNote}
      onBack={handleBackToGrid}
      onCreateNote={handleQuickCreateNote}
    />
  );
}
