import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Settings, FileText, ChevronDown, Zap, ArrowUpDown, Pin, Clock, Layers } from "lucide-react";
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
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { cn } from "@/lib/utils";

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
  scribbleStrokes?: string;
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

// Creative gradient presets for indicators
const CATEGORY_GRADIENTS: Record<string, string> = {
  inbox: "linear-gradient(135deg, #94a3b8 0%, #64748b 50%, #475569 100%)",
  work: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)",
  personal: "linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)",
  wellness: "linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)",
  hobby: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)",
};

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

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function StatCard({
  label,
  value,
  icon,
  hint,
  index = 0,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
  index?: number;
}) {
  return (
    <div
      className="rounded-xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: "backwards" }}
    >
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="mt-1.5 text-xl font-semibold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground/60">{hint}</p>}
        </div>
        <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Notes() {
  const { toast } = useToast();
  const { user } = useAuth();

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
  const [notesView, setNotesView] = useState<NotesViewType>("atlas");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.warn("Could not save notes to localStorage - quota exceeded. Data will sync to cloud.");
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    } catch (e) {
      console.warn("Could not save groups to localStorage");
    }
  }, [groups]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
    } catch (e) {
      console.warn("Could not save folders to localStorage");
    }
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

  const insights = useMemo(() => {
    const activeNotes = notes.filter((n) => !n.isArchived);
    const now = new Date();
    const editedToday = activeNotes.filter((n) => isSameDay(new Date(n.updatedAt), now)).length;
    const pinned = activeNotes.filter((n) => n.isPinned).length;
    const activeGroups = groups.filter((g) => activeNotes.some((n) => n.groupId === g.id)).length;

    return {
      total: activeNotes.length,
      editedToday,
      pinned,
      activeGroups,
    };
  }, [notes, groups]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned).slice(0, 6), [filteredNotes]);

  const getGroupName = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.name || "Unknown";
  };

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
        toast({
          title: "Couldn't sync note to Diary",
          description: "Please try saving again.",
          variant: "destructive",
        });
      }
    } catch {
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
    // Also update selectedNote so it stays in sync
    if (selectedNote?.id === updatedNote.id) {
      setSelectedNote(noteWithTimestamp);
    }
    await syncNoteToSupabase(noteWithTimestamp);
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

  const handleGroupsChange = (newGroups: NoteGroup[]) => setGroups(newGroups);

  // =========================
  // OVERVIEW
  // =========================
  if (viewMode === "overview") {
    return (
      <div className="w-full flex-1 pb-24">
        {/* Hero */}
        <PageHero
          storageKey="notes_hero_src"
          typeKey="notes_hero_type"
          badge={PAGE_HERO_TEXT.notes.badge}
          title={PAGE_HERO_TEXT.notes.title}
          subtitle={PAGE_HERO_TEXT.notes.subtitle}
        />

        <div className="w-full space-y-6 px-6 lg:px-8 pt-6">
          {/* Header */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-end">
            <div className="flex items-center gap-2 lg:justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="group relative h-11 rounded-full px-6 overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-0 p-[2px] bg-transparent">
                    {/* Aurora gradient border - animated */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 via-pink-500 to-cyan-400 bg-[length:300%_100%] animate-[shimmer_4s_linear_infinite] opacity-90" />
                    {/* Inner background - cream for light, dark for dark mode */}
                    <div className="absolute inset-[2px] rounded-full bg-amber-50 dark:bg-slate-900 transition-colors" />
                    {/* Subtle glow */}
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 blur-xl" />
                    {/* Content */}
                    <span className="relative flex items-center font-semibold tracking-wide text-slate-700 dark:text-white px-4">
                      <Plus className="h-4 w-4 mr-2" />
                      NEW NOTE
                      <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
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
                className="h-10 w-10 rounded-xl"
                onClick={() => setSettingsOpen(true)}
                aria-label="Notes settings"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="p-4 flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold tracking-wider text-muted-foreground hidden md:block">
                  VIEW MODE
                </div>
                <NotesViewSwitcher currentView={notesView} onViewChange={setNotesView} />
              </div>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes, tags, text..."
                  className="h-10 rounded-xl pl-10 bg-background"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="h-10 rounded-xl w-[180px]">
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
            </div>

            {/* Filter chips - Underlined style */}
            <div className="px-4 pb-4">
              <div className="flex gap-4 overflow-auto no-scrollbar">
                <button
                  onClick={() => setFilterGroupId("all")}
                  className={cn(
                    "h-6 px-0 text-[10px] uppercase tracking-wider font-light whitespace-nowrap transition-colors border-b",
                    filterGroupId === "all"
                      ? "text-foreground border-foreground"
                      : "text-muted-foreground hover:text-foreground border-transparent",
                  )}
                >
                  All
                </button>

                {sortedGroups.map((group) => {
                  const active = filterGroupId === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setFilterGroupId(group.id)}
                      className={cn(
                        "h-6 px-0 text-[10px] uppercase tracking-wider font-light whitespace-nowrap transition-colors border-b flex items-center gap-2",
                        active
                          ? "text-foreground border-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground border-transparent",
                      )}
                    >
                      {/* Curved gradient pill indicator */}
                      <span
                        className="w-4 h-1.5 rounded-full"
                        style={{ background: CATEGORY_GRADIENTS[group.id] || group.color }}
                      />
                      {group.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total notes" value={`${insights.total}`} icon={<FileText className="h-5 w-5" />} />
            <StatCard label="Edited today" value={`${insights.editedToday}`} icon={<Clock className="h-5 w-5" />} />
            <StatCard label="Pinned" value={`${insights.pinned}`} icon={<Pin className="h-5 w-5" />} />
            <StatCard label="Active groups" value={`${insights.activeGroups}`} icon={<Layers className="h-5 w-5" />} />
          </div>

          {/* Pinned */}
          {pinnedNotes.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Pinned</p>
                  <p className="text-sm text-muted-foreground mt-1">Fast access to what matters.</p>
                </div>
              </div>

              <div className="px-4 pb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pinnedNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNoteClick(n)}
                    className="text-left rounded-2xl border border-border/40 bg-background/60 hover:bg-background/80 hover:shadow-sm transition-all p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{n.title || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.plainText || "No content"}</p>
                      </div>
                      <Pin className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{getGroupName(n.groupId)}</span>
                      <span>{formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                    onDeleteNote={handleDeleteNote}
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

          {/* Empty */}
          {sortedGroups.length === 0 && (
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-10 text-center">
              <p className="text-muted-foreground mb-4">No groups yet. Create your first group to get started.</p>
              <Button className="h-10 rounded-xl" onClick={() => setSettingsOpen(true)}>
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

          {/* Location Picker */}
          <NotesLocationPicker
            open={locationPickerOpen}
            onOpenChange={setLocationPickerOpen}
            groups={groups}
            folders={folders}
            onConfirm={handleCreateNote}
          />
        </div>
      </div>
    );
  }

  // =========================
  // EDITOR (Split View)
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
