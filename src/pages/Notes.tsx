import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Settings,
  FileText,
  ChevronDown,
  Zap,
  ArrowUpDown,
  LayoutGrid,
  KanbanSquare,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotesSplitView } from "@/components/notes/NotesSplitView";
import { NotesGroupSettings } from "@/components/notes/NotesGroupSettings";
import { NotesGroupSection } from "@/components/notes/NotesGroupSection";
import { NotesLocationPicker } from "@/components/notes/NotesLocationPicker";
import { NotesBoardView } from "@/components/notes/NotesBoardView";
import { NotesMindMapView } from "@/components/notes/NotesMindMapView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    plainText:
      "Focus on social media channels and influencer partnerships for launch. Key Focus Areas: Social Media Channels.",
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
];

type ViewMode = "overview" | "editor";
type SortOption = "updatedAt" | "createdAt" | "title";
type NotesView = "atlas" | "board" | "mindmap";

function safeUUID() {
  // fallback for environments without crypto.randomUUID
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export default function Notes() {
  const { toast } = useToast();

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

  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("updatedAt");
  const [filterGroupId, setFilterGroupId] = useState<string>("all");
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [notesView, setNotesView] = useState<NotesView>("atlas");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  }, [folders]);

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups]);

  const filteredNotes = useMemo(() => {
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
        if (sortBy === "title") return a.title.localeCompare(b.title);
        const dateA = new Date(a[sortBy]).getTime();
        const dateB = new Date(b[sortBy]).getTime();
        return dateB - dateA;
      });
  }, [notes, searchQuery, filterGroupId, sortBy]);

  const getGroupName = (groupId: string) => groups.find((g) => g.id === groupId)?.name || "Unknown";

  const handleCreateNote = (groupId: string, folderId: string | null) => {
    const newNote: Note = {
      id: safeUUID(),
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
    setViewMode("editor");
  };

  const handleQuickNote = () => {
    if (!groups.find((g) => g.id === "inbox")) {
      const inboxGroup: NoteGroup = {
        id: "inbox",
        name: "Inbox",
        color: "hsl(215, 20%, 65%)",
        sortOrder: -1,
      };
      setGroups([inboxGroup, ...groups]);
    }
    handleCreateNote("inbox", null);
  };

  const handleNewNoteWithOptions = () => setLocationPickerOpen(true);

  const handleCreateFolder = (groupId: string, folderName: string) => {
    const newFolder: NoteFolder = {
      id: safeUUID(),
      groupId,
      name: folderName,
      sortOrder: folders.filter((f) => f.groupId === groupId).length,
    };
    setFolders([...folders, newFolder]);
    toast({
      title: "Section created",
      description: `"${folderName}" added to ${getGroupName(groupId)}`,
    });
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
    setViewMode("editor");
  };

  const handleBackToOverview = () => {
    setViewMode("overview");
    setSelectedNote(null);
  };

  const handleGroupsChange = (newGroups: NoteGroup[]) => setGroups(newGroups);

  // ---------- OVERVIEW ----------
  if (viewMode === "overview") {
    return (
      <div className="w-full flex-1 space-y-6 pb-20">
        {/* Header (match Tasks style: left title, right actions) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your life atlas — everything in one calm view</p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New note
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleNewNoteWithOptions} className="py-2.5">
                  <FileText className="h-4 w-4 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-sm">New Note</span>
                    <span className="text-xs text-muted-foreground">Choose group/section</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleQuickNote} className="py-2.5">
                  <Zap className="h-4 w-4 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-sm">Quick Note</span>
                    <span className="text-xs text-muted-foreground">Saves to Inbox</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Notes settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Controls row (View toggle + Search + Sort) */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* View toggle (no NotesViewSwitcher dependency) */}
          <div className="flex items-center gap-1 rounded-xl border bg-background p-1 w-fit">
            <Button
              type="button"
              variant={notesView === "atlas" ? "default" : "ghost"}
              size="sm"
              onClick={() => setNotesView("atlas")}
              className="gap-2 rounded-lg"
            >
              <LayoutGrid className="h-4 w-4" />
              Atlas
            </Button>
            <Button
              type="button"
              variant={notesView === "board" ? "default" : "ghost"}
              size="sm"
              onClick={() => setNotesView("board")}
              className="gap-2 rounded-lg"
            >
              <KanbanSquare className="h-4 w-4" />
              Board
            </Button>
            <Button
              type="button"
              variant={notesView === "mindmap" ? "default" : "ghost"}
              size="sm"
              onClick={() => setNotesView("mindmap")}
              className="gap-2 rounded-lg"
            >
              <Share2 className="h-4 w-4" />
              Mind Map
            </Button>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-10 h-10 rounded-xl"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[170px] h-10 rounded-xl">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Last edited</SelectItem>
              <SelectItem value="createdAt">Created date</SelectItem>
              <SelectItem value="title">A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Group filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterGroupId("all")}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              filterGroupId === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            }`}
          >
            All
          </button>

          {sortedGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setFilterGroupId(group.id)}
              className={`px-3 py-1.5 rounded-full text-sm border flex items-center gap-2 transition-colors ${
                filterGroupId === group.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} />
              {group.name}
            </button>
          ))}
        </div>

        {/* Content */}
        {notesView === "atlas" && (
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
        )}

        {notesView === "board" && (
          <NotesBoardView
            groups={sortedGroups.filter((g) => filterGroupId === "all" || g.id === filterGroupId)}
            folders={folders}
            notes={filteredNotes}
            selectedNoteId={selectedNote?.id}
            onNoteClick={handleNoteClick}
            onAddNote={handleCreateNote}
            onAddFolder={handleCreateFolder}
          />
        )}

        {notesView === "mindmap" && (
          <NotesMindMapView
            groups={sortedGroups.filter((g) => filterGroupId === "all" || g.id === filterGroupId)}
            folders={folders}
            notes={filteredNotes}
            selectedNoteId={selectedNote?.id}
            onNoteClick={handleNoteClick}
            onAddNote={handleCreateNote}
            onAddFolder={handleCreateFolder}
          />
        )}

        {/* Settings */}
        <NotesGroupSettings
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          groups={groups}
          onGroupsChange={handleGroupsChange}
          folders={folders}
          onFoldersChange={setFolders}
        />

        {/* Location Picker */}
        <NotesLocationPicker
          open={locationPickerOpen}
          onOpenChange={setLocationPickerOpen}
          groups={groups}
          folders={folders}
          onConfirm={handleCreateNote}
        />
      </div>
    );
  }

  // ---------- EDITOR ----------
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
