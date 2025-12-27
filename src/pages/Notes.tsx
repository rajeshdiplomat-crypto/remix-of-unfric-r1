import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, Search, Settings, FileText, ChevronDown, FolderPlus, Zap, Filter, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotesSplitView } from "@/components/notes/NotesSplitView";
import { NotesGroupSettings } from "@/components/notes/NotesGroupSettings";
import { NotesGroupSection } from "@/components/notes/NotesGroupSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
const STORAGE_KEY_LAST_LOCATION = "notes-last-location";

const DEFAULT_GROUPS: NoteGroup[] = [
  { id: "inbox", name: "Inbox", color: "hsl(215, 20%, 65%)", sortOrder: 0 },
  { id: "work", name: "Work", color: "hsl(221, 83%, 53%)", sortOrder: 1 },
  { id: "personal", name: "Personal", color: "hsl(142, 71%, 45%)", sortOrder: 2 },
  { id: "wellness", name: "Wellness", color: "hsl(262, 83%, 58%)", sortOrder: 3 },
  { id: "hobby", name: "Hobby", color: "hsl(25, 95%, 53%)", sortOrder: 4 },
];

const SAMPLE_NOTES: Note[] = [
  {
    id: "1",
    groupId: "work",
    folderId: null,
    title: "Q4 Marketing Strategy",
    contentRich: "Focus on social media channels and influencer partnerships for launch...",
    plainText: "Focus on social media channels and influencer partnerships for launch. Key Focus Areas: Social Media Channels.",
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
    contentRich: "Action items: Update color palette, review typography choices",
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
    contentRich: "Milk, eggs, bread, avocados, coffee beans, spinach",
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
    contentRich: "Day 1: Tokyo arrival, Shinjuku dinner. Day 2: Kyoto temples",
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
    contentRich: "Today I am grateful for the sunny weather and morning coffee",
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
    contentRich: "The Silent Patient, Project Hail Mary, Atomic Habits",
    plainText: "The Silent Patient, Project Hail Mary, Atomic Habits",
    tags: ["reading"],
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    isPinned: false,
    isArchived: false,
  },
];

type ViewMode = "overview" | "editor";
type SortOption = "updatedAt" | "createdAt" | "title";

export default function Notes() {
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

  const [lastLocation, setLastLocation] = useState<{ groupId: string; folderId: string | null }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LAST_LOCATION);
    return saved ? JSON.parse(saved) : { groupId: "inbox", folderId: null };
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("updatedAt");
  const [filterGroupId, setFilterGroupId] = useState<string>("all");

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LAST_LOCATION, JSON.stringify(lastLocation));
  }, [lastLocation]);

  // Filter and sort notes
  const getFilteredNotes = () => {
    return notes
      .filter((note) => {
        if (note.isArchived) return false;
        
        const matchesSearch = searchQuery
          ? note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.plainText.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          : true;
        
        const matchesFilter = filterGroupId === "all" || note.groupId === filterGroupId;
        
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        const dateA = new Date(a[sortBy]).getTime();
        const dateB = new Date(b[sortBy]).getTime();
        return dateB - dateA;
      });
  };

  const filteredNotes = getFilteredNotes();

  const getGroupName = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.name || "Unknown";
  };

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return null;
    return folders.find((f) => f.id === folderId)?.name || null;
  };

  // Create note inline (no modal)
  const handleCreateNote = (groupId: string, folderId: string | null) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      groupId,
      folderId,
      title: "",
      contentRich: "",
      plainText: "",
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      isArchived: false,
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setLastLocation({ groupId, folderId });
    setViewMode("editor");
  };

  // Quick note - goes to Inbox
  const handleQuickNote = () => {
    handleCreateNote("inbox", null);
  };

  // New note with options - uses last location
  const handleNewNoteWithOptions = () => {
    handleCreateNote(lastLocation.groupId, lastLocation.folderId);
  };

  // Create folder inline
  const handleCreateFolder = (groupId: string, folderName: string) => {
    const newFolder: NoteFolder = {
      id: crypto.randomUUID(),
      groupId,
      name: folderName,
      sortOrder: folders.filter((f) => f.groupId === groupId).length,
    };
    setFolders([...folders, newFolder]);
    toast({ title: "Section created", description: `"${folderName}" added to ${getGroupName(groupId)}` });
  };

  const handleSaveNote = (updatedNote: Note) => {
    setNotes(notes.map((n) => (n.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date().toISOString() } : n)));
    toast({ title: "Note saved" });
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter((n) => n.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setViewMode("overview");
    }
    toast({ title: "Note deleted" });
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setLastLocation({ groupId: note.groupId, folderId: note.folderId });
    setViewMode("editor");
  };

  const handleBackToOverview = () => {
    setViewMode("overview");
    setSelectedNote(null);
  };

  const handleGroupsChange = (newGroups: NoteGroup[]) => {
    setGroups(newGroups);
  };

  // Sort groups by sortOrder
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  // Get last location display text
  const getLastLocationText = () => {
    const groupName = getGroupName(lastLocation.groupId);
    const folderName = getFolderName(lastLocation.folderId);
    return folderName ? `${groupName} ▸ ${folderName}` : groupName;
  };

  // Overview (Life Atlas Layout)
  if (viewMode === "overview") {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Notes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your life atlas — everything in one calm view
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* New Note Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  New note
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleNewNoteWithOptions}>
                  <FileText className="h-4 w-4 mr-2" />
                  <div className="flex flex-col">
                    <span>New Note (with options)</span>
                    <span className="text-xs text-muted-foreground">Creating in: {getLastLocationText()}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleQuickNote}>
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Note
                  <span className="ml-auto text-xs text-muted-foreground">→ Inbox</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Manage Groups & Sections
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all notes..."
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Filter by Group */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filterGroupId === "all" ? "All Groups" : getGroupName(filterGroupId)}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-2">
                <div className="space-y-1">
                  <button
                    onClick={() => setFilterGroupId("all")}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm ${filterGroupId === "all" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  >
                    All Groups
                  </button>
                  {sortedGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setFilterGroupId(group.id)}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${filterGroupId === group.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                    >
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} />
                      {group.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[140px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">Last edited</SelectItem>
                <SelectItem value="createdAt">Created date</SelectItem>
                <SelectItem value="title">A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Groups - Vertical Stacked Layout */}
        <div className="space-y-4">
          {sortedGroups
            .filter((g) => filterGroupId === "all" || g.id === filterGroupId)
            .map((group) => (
              <NotesGroupSection
                key={group.id}
                group={group}
                folders={folders}
                notes={filteredNotes}
                selectedNoteId={selectedNote?.id}
                onNoteClick={handleNoteClick}
                onAddNote={handleCreateNote}
                onAddFolder={handleCreateFolder}
              />
            ))}
        </div>

        {/* Empty State */}
        {sortedGroups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No groups yet. Create your first group to get started.</p>
            <Button onClick={() => setSettingsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        )}

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

  // Editor View (Split View)
  return (
    <NotesSplitView
      notes={filteredNotes}
      groups={groups}
      folders={folders}
      selectedNote={selectedNote}
      onSelectNote={setSelectedNote}
      onSaveNote={handleSaveNote}
      onDeleteNote={handleDeleteNote}
      onBack={handleBackToOverview}
      onCreateNote={handleQuickNote}
    />
  );
}
