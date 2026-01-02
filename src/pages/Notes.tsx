import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Settings, FileText, ChevronDown, Zap, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { NotesSplitView } from "@/components/notes/NotesSplitView";
import { NotesGroupSettings } from "@/components/notes/NotesGroupSettings";
import { NotesGroupSection } from "@/components/notes/NotesGroupSection";
import { NotesLocationPicker } from "@/components/notes/NotesLocationPicker";
import { NotesBoardView } from "@/components/notes/NotesBoardView";
import { NotesMindMapView } from "@/components/notes/NotesMindMapView";
import { NotesViewSwitcher, type NotesViewType } from "@/components/notes/NotesViewSwitcher";

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

const isBrowser = typeof window !== "undefined";
function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function Notes() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Load from localStorage or use defaults
  const [notes, setNotes] = useState<Note[]>(() => readJSON(STORAGE_KEY_NOTES, SAMPLE_NOTES));
  const [groups, setGroups] = useState<NoteGroup[]>(() => readJSON(STORAGE_KEY_GROUPS, DEFAULT_GROUPS));
  const [folders, setFolders] = useState<NoteFolder[]>(() => readJSON(STORAGE_KEY_FOLDERS, []));

  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("updatedAt");
  const [filterGroupId, setFilterGroupId] = useState<string>("all");
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [notesView, setNotesView] = useState<NotesViewType>("atlas");

  // Persist to localStorage
  useEffect(() => {
    if (!isBrowser) return;
    window.localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (!isBrowser) return;
    window.localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    if (!isBrowser) return;
    window.localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  }, [folders]);

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        if (note.isArchived) return false;

        const q = searchQuery.trim().toLowerCase();
        const matchesSearch = q
          ? note.title.toLowerCase().includes(q) ||
            note.plainText.toLowerCase().includes(q) ||
            note.tags.some((tag) => tag.toLowerCase().includes(q))
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

  // Sync note to Supabase for Diary feed
  const syncNoteToSupabase = async (note: Note) => {
    if (!user?.id) return;

    const category: "thoughts" | "creative" | "private" =
      note.groupId === "personal" ? "private" : note.groupId === "hobby" ? "creative" : "thoughts";

    try {
      const { error } = await supabase.from("notes").upsert({
        id: note.id,
        user_id: user.id,
        title: note.title || "Untitled",
        content: note.plainText || note.contentRich,
        category,
        tags: note.tags,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
      });

      if (error) {
        console.error("Failed to sync note:", error);
        toast({
          title: "Couldn't sync note to Diary",
          description: "Please try saving again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error syncing note:", err);
      toast({
        title: "Couldn't sync note to Diary",
        description: "Please try saving again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateNote = async (groupId: string, folderId: string | null) => {
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
      id: crypto.randomUUID(),
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

  const handleSaveNote = async (updatedNote: Note) => {
    const noteWithTimestamp = { ...updatedNote, updatedAt: new Date().toISOString() };
    setNotes(notes.map((n) => (n.id === updatedNote.id ? noteWithTimestamp : n)));
    await syncNoteToSupabase(noteWithTimestamp);
    toast({ title: "Note saved" });
  };

  const handleDeleteNote = async (noteId: string) => {
    setNotes(notes.filter((n) => n.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setViewMode("overview");
    }

    if (user?.id) {
      await supabase.from("notes").delete().eq("id", noteId).eq("user_id", user.id);
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

  // =========================
  // OVERVIEW
  // =========================
  if (viewMode === "overview") {
    return (
      <main className="flex-1 w-full px-8 lg:px-10 py-6 pb-20">
        {/* Header: Tasks-like */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Notes</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your life atlas — everything in one calm view</p>
          </div>

          <div className="flex items-center gap-2 lg:justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-9 rounded-xl px-4 shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New note
                  <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={handleNewNoteWithOptions} className="py-2.5">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm">New Note</span>
                    <span className="text-xs text-muted-foreground">Choose where to save</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleQuickNote} className="py-2.5">
                  <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm">Quick Note</span>
                    <span className="text-xs text-muted-foreground">Send to Inbox</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setSettingsOpen(true)}
              aria-label="Notes settings"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground hidden md:block">
              VIEW MODE
            </div>

            <NotesViewSwitcher currentView={notesView} onViewChange={(v) => setNotesView(v)} />
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="h-9 rounded-xl pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-9 rounded-xl w-[170px]">
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

        {/* Group chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterGroupId("all")}
            className={`h-9 rounded-full px-4 chip ${
              filterGroupId === "all" ? "bg-primary/10 text-primary border-primary/30" : "text-foreground/80"
            }`}
          >
            All
          </Button>

          {sortedGroups.map((group) => {
            const active = filterGroupId === group.id;
            return (
              <Button
                key={group.id}
                variant="outline"
                size="sm"
                onClick={() => setFilterGroupId(group.id)}
                className={`h-9 rounded-full px-4 border-l-2 chip ${
                  active ? "bg-primary/10 text-primary border-primary/30" : "text-foreground/80"
                }`}
                style={{ borderLeftColor: group.color }}
              >
                {group.name}
              </Button>
            );
          })}
        </div>

        {/* Views */}
        {notesView === "atlas" && (
          <div className="space-y-3">
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
          <div className="rounded-2xl border border-border/40 bg-card/40 shadow-sm overflow-hidden">
            <NotesMindMapView
              groups={sortedGroups.filter((g) => filterGroupId === "all" || g.id === filterGroupId)}
              folders={folders}
              notes={filteredNotes}
              selectedNoteId={selectedNote?.id}
              onNoteClick={handleNoteClick}
              onAddNote={handleCreateNote}
              onAddFolder={handleCreateFolder}
            />
          </div>
        )}

        {/* Empty state */}
        {sortedGroups.length === 0 && (
          <div className="rounded-2xl border border-border/40 bg-card/40 p-10 text-center shadow-sm">
            <p className="text-muted-foreground mb-4">No groups yet. Create your first group to get started.</p>
            <Button className="h-9 rounded-xl" onClick={() => setSettingsOpen(true)}>
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
          onGroupsChange={setGroups}
          folders={folders}
          onFoldersChange={setFolders}
        />

        {/* Location Picker Dialog */}
        <NotesLocationPicker
          open={locationPickerOpen}
          onOpenChange={setLocationPickerOpen}
          groups={groups}
          folders={folders}
          onConfirm={handleCreateNote}
        />
      </main>
    );
  }

  // =========================
  // EDITOR
  // =========================
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
