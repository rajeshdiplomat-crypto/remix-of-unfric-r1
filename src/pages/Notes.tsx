import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Settings,
  FileText,
  ChevronDown,
  Zap,
  ArrowUpDown,
  Pin,
  Clock,
  Layers,
  Moon,
  Sun,
  Image,
  MoreHorizontal,
  Upload,
  Palette,
  FolderPlus,
} from "lucide-react";
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
import { useTheme } from "@/contexts/ThemeContext";
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
  isCompleted?: boolean;
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

const BACKGROUND_PRESETS: { id: string; url: string; name: string; type: "image" | "gradient" | "none" }[] = [
  // High quality images
  {
    id: "forest",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=3840&q=100&auto=format&fit=crop",
    name: "Forest",
    type: "image",
  },
  {
    id: "mountain",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=3840&q=100&auto=format&fit=crop",
    name: "Mountains",
    type: "image",
  },
  {
    id: "ocean",
    url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=3840&q=100&auto=format&fit=crop",
    name: "Ocean",
    type: "image",
  },
  {
    id: "nebula",
    url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=3840&q=100&auto=format&fit=crop",
    name: "Nebula",
    type: "image",
  },
  {
    id: "aurora",
    url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=3840&q=100&auto=format&fit=crop",
    name: "Aurora",
    type: "image",
  },
  {
    id: "minimal",
    url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=3840&q=100&auto=format&fit=crop",
    name: "Gradient",
    type: "image",
  },
  { id: "none", url: "", name: "None", type: "none" },
];

const COLOR_THEMES = [
  { id: "sunset", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)", name: "Sunset" },
  { id: "ocean", gradient: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)", name: "Ocean" },
  { id: "forest", gradient: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)", name: "Forest" },
  { id: "warm", gradient: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)", name: "Warm" },
  { id: "midnight", gradient: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", name: "Midnight" },
  { id: "rose", gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", name: "Rose" },
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
      className="rounded border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: "backwards" }}
    >
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="mt-1.5 text-xl font-semibold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground/60">{hint}</p>}
        </div>
        <div className="h-10 w-10 rounded bg-muted/30 flex items-center justify-center text-muted-foreground shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Notes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

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

  // Background state
  const [backgroundUrl, setBackgroundUrl] = useState<string>(() => {
    return localStorage.getItem("notes_background") || BACKGROUND_PRESETS[0].url;
  });

  const handleBackgroundChange = (url: string) => {
    setBackgroundUrl(url);
    if (url) localStorage.setItem("notes_background", url);
    else localStorage.removeItem("notes_background");
  };

  // =========================
  // OVERVIEW
  // =========================
  if (viewMode === "overview") {
    return (
      <div className="w-full flex-1 pb-24 relative min-h-screen">
        {/* Global Background */}
        {backgroundUrl && (
          <div className="fixed inset-0 z-0 pointer-events-none">
            {backgroundUrl.startsWith("linear-gradient") || backgroundUrl.startsWith("data:") ? (
              // Gradient or data URL background
              <div
                className="absolute inset-0 transition-all duration-700"
                style={{
                  background: backgroundUrl.startsWith("linear-gradient") ? backgroundUrl : undefined,
                  backgroundImage: backgroundUrl.startsWith("data:") ? `url("${backgroundUrl}")` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              // Regular image URL
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
                style={{ backgroundImage: `url("${backgroundUrl}")` }}
              />
            )}
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px]" />
          </div>
        )}

        <div className="relative z-10 w-full">
          <div className="w-full space-y-4 px-6 lg:px-8 pt-6">
            {/* Page Header */}
            <div className="py-4">
              <p className="text-[10px] font-medium tracking-[0.3em] text-muted-foreground/70 uppercase mb-2">
                Life Atlas
              </p>
              <h1 className="text-4xl md:text-5xl font-light tracking-wide text-foreground">NOTES</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Your ideas, organized in one calm, premium view
              </p>
            </div>

            {/* Sleek Unified Toolbar */}
            <div className="rounded border border-border/40 bg-card/90 backdrop-blur-md shadow-sm">
              <div className="p-3 flex flex-wrap items-center gap-3">
                {/* View Mode Switcher */}
                <div className="flex items-center gap-2">
                  <NotesViewSwitcher currentView={notesView} onViewChange={setNotesView} />
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-6 bg-border/30" />

                {/* Search - Rounded Pill */}
                <div className="relative flex-1 min-w-[140px] max-w-[260px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="h-9 rounded pl-9 pr-4 text-sm bg-background/70 border-border/40 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Sort Select - Pill Shape */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="h-9 rounded w-[130px] text-xs bg-background/70 border-border/40 hover:bg-background transition-colors">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent className="rounded">
                    <SelectItem value="updatedAt">Last edited</SelectItem>
                    <SelectItem value="createdAt">Created</SelectItem>
                    <SelectItem value="title">A–Z</SelectItem>
                  </SelectContent>
                </Select>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Add Section Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 rounded border-border/50 bg-background/70 hover:bg-background hover:border-primary/40 transition-all gap-2"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs uppercase tracking-wide">Add Section</span>
                  </Button>

                  {/* New Note Button - Simple gradient */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        className="h-9 px-4 rounded bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-all gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs uppercase tracking-wide">New Note</span>
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded p-1">
                      <DropdownMenuItem onClick={handleNewNoteWithOptions} className="py-2 rounded cursor-pointer">
                        <FileText className="h-4 w-4 mr-3 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">New Note</span>
                          <span className="text-xs text-muted-foreground">Choose location</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleQuickNote} className="py-2 rounded cursor-pointer">
                        <Zap className="h-4 w-4 mr-3 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Quick Note</span>
                          <span className="text-xs text-muted-foreground">Send to Inbox</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* More Options Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-md hover:bg-muted/50 transition-all"
                        title="More options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-md p-2">
                      {/* Settings */}
                      <DropdownMenuItem
                        onClick={() => setSettingsOpen(true)}
                        className="py-2 rounded-md cursor-pointer"
                      >
                        <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>Group Settings</span>
                      </DropdownMenuItem>

                      {/* Theme Toggle */}
                      <DropdownMenuItem
                        onClick={() => setTheme(theme.isDark ? "calm-blue" : "midnight-dark")}
                        className="py-2 rounded-md cursor-pointer"
                      >
                        {theme.isDark ? (
                          <Sun className="h-4 w-4 mr-3 text-amber-500" />
                        ) : (
                          <Moon className="h-4 w-4 mr-3 text-indigo-500" />
                        )}
                        <span>{theme.isDark ? "Light Mode" : "Dark Mode"}</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-2" />

                      {/* Color Themes */}
                      <div className="px-2 py-2">
                        <div className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <Palette className="h-3.5 w-3.5" />
                          Color Themes
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {COLOR_THEMES.map((colorTheme) => (
                            <button
                              key={colorTheme.id}
                              onClick={() => handleBackgroundChange(colorTheme.gradient)}
                              className={cn(
                                "w-8 h-8 rounded-full transition-all hover:scale-110 shadow-sm",
                                backgroundUrl === colorTheme.gradient
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                  : "",
                              )}
                              style={{ background: colorTheme.gradient }}
                              title={colorTheme.name}
                            />
                          ))}
                        </div>
                      </div>

                      <DropdownMenuSeparator className="my-2" />

                      {/* Background Images */}
                      <div className="px-2 py-2">
                        <div className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <Image className="h-3.5 w-3.5" />
                          Background Image
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {BACKGROUND_PRESETS.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => handleBackgroundChange(bg.url)}
                              className={cn(
                                "relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                                backgroundUrl === bg.url
                                  ? "border-primary shadow-lg"
                                  : "border-transparent hover:border-border",
                              )}
                              title={bg.name}
                            >
                              {bg.url ? (
                                <img src={bg.url} alt={bg.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                  <span className="text-[9px] font-medium text-muted-foreground">None</span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <DropdownMenuSeparator className="my-2" />

                      {/* Upload Custom Image */}
                      <div className="px-2 py-2">
                        <label className="flex items-center gap-3 py-2.5 px-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Upload Custom Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const dataUrl = event.target?.result as string;
                                  handleBackgroundChange(dataUrl);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Filter chips - Pill style */}
              <div className="px-4 pb-4">
                <div className="flex gap-2 overflow-auto no-scrollbar">
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
              <StatCard
                label="Active groups"
                value={`${insights.activeGroups}`}
                icon={<Layers className="h-5 w-5" />}
              />
            </div>

            {/* Pinned */}
            {pinnedNotes.length > 0 && (
              <div className="rounded border border-border/50 bg-card shadow-sm">
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
                      className="text-left rounded border border-border/40 bg-background/60 hover:bg-background/80 hover:shadow-sm transition-all p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{n.title || "Untitled"}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {n.plainText || "No content"}
                          </p>
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
                      allGroups={sortedGroups}
                      selectedNoteId={selectedNote?.id}
                      onNoteClick={handleNoteClick}
                      onDeleteNote={handleDeleteNote}
                      onUpdateNote={handleSaveNote}
                      onAddNote={handleCreateNote}
                      onAddFolder={handleCreateFolder}
                    />
                  ))}
              </div>
            )}

            {notesView === "board" && (
              <div className="relative z-10">
                <NotesBoardView
                  groups={sortedGroups.filter((g) => filterGroupId === "all" || g.id === filterGroupId)}
                  folders={folders}
                  notes={filteredNotes}
                  selectedNoteId={selectedNote?.id}
                  onNoteClick={handleNoteClick}
                  onDeleteNote={handleDeleteNote}
                  onAddNote={handleCreateNote}
                  onAddFolder={handleCreateFolder}
                  onUpdateNote={handleSaveNote}
                  onAddGroup={() => setSettingsOpen(true)}
                />
              </div>
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
                onUpdateNote={handleSaveNote}
                onDeleteNote={handleDeleteNote}
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
