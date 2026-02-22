import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { MobileNoteEditor } from "@/components/notes/MobileNoteEditor";
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
  coverImage?: string; // Custom cover image URL
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
  sortOrder?: number;
  pageTheme?: string;
  lineStyle?: string;
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

// Modern stat card with glassmorphism and gradient accent
function StatCard({
  label,
  value,
  icon,
  hint,
  index = 0,
  accentColor = "primary",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
  index?: number;
  accentColor?: string;
}) {
  const gradients: Record<string, string> = {
    primary: "from-slate-500/20 to-zinc-500/10",
    blue: "from-blue-500/20 to-cyan-500/10",
    green: "from-emerald-500/20 to-teal-500/10",
    orange: "from-orange-500/20 to-amber-500/10",
  };

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-border transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: "backwards" }}
    >
      <div className="relative px-3 py-2.5 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary/60 shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/50">{label}</p>
          <p className="text-lg font-light text-foreground tracking-tight leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function Notes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);

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

  // Load default notes view from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_settings")
      .select("default_notes_view")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const v = (data as any)?.default_notes_view;
        if (v === "board" || v === "mindmap" || v === "atlas") {
          // On mobile, fall back from mindmap/board to atlas
          setNotesView((isMobile && (v === "mindmap" || v === "board")) ? "atlas" : v as NotesViewType);
        }
      });
  }, [user]);

  // Sync groups and folders from DB, seed defaults if missing
  useEffect(() => {
    if (!user) return;
    const loadFromDb = async () => {
      const [groupsRes, foldersRes] = await Promise.all([
        supabase.from("note_groups").select("*").eq("user_id", user.id).order("sort_order"),
        supabase.from("note_folders").select("*").eq("user_id", user.id).order("sort_order"),
      ]);

      let dbGroups: NoteGroup[] = [];
      if (groupsRes.data && groupsRes.data.length > 0) {
        dbGroups = groupsRes.data.map((g: any) => ({
          id: g.id,
          name: g.name,
          color: g.color,
          sortOrder: g.sort_order,
        }));
      }

      // Seed any missing default groups
      const existingNames = new Set(dbGroups.map((g) => g.name.toLowerCase()));
      const missingDefaults = DEFAULT_GROUPS.filter((dg) => !existingNames.has(dg.name.toLowerCase()));
      if (missingDefaults.length > 0) {
        const maxOrder = dbGroups.length > 0 ? Math.max(...dbGroups.map((g) => g.sortOrder)) + 1 : 0;
        const newGroups: NoteGroup[] = [];
        for (let i = 0; i < missingDefaults.length; i++) {
          const dg = missingDefaults[i];
          const newId = crypto.randomUUID();
          const sortOrder = maxOrder + i;
          await supabase.from("note_groups").insert({
            id: newId,
            user_id: user.id,
            name: dg.name,
            color: dg.color,
            sort_order: sortOrder,
          } as any);
          newGroups.push({ id: newId, name: dg.name, color: dg.color, sortOrder });
        }
        dbGroups = [...dbGroups, ...newGroups];
      }

      if (dbGroups.length > 0) {
        setGroups(dbGroups);
      }

      if (foldersRes.data && foldersRes.data.length > 0) {
        const dbFolders: NoteFolder[] = foldersRes.data.map((f: any) => ({
          id: f.id,
          groupId: f.group_id,
          name: f.name,
          sortOrder: f.sort_order,
        }));
        setFolders(dbFolders);
      }
    };
    loadFromDb();
  }, [user]);

  // Write-ahead cache: save to localStorage for offline access
  useEffect(() => {
    if (!notesLoaded) return; // Don't overwrite cache before DB load
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.warn("Could not save notes to localStorage - quota exceeded. Data will sync to cloud.");
    }
  }, [notes, notesLoaded]);

  // Save groups to both localStorage and DB
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    } catch (e) {
      console.warn("Could not save groups to localStorage");
    }
    if (!user) return;
    // Debounced DB sync
    const timeout = setTimeout(async () => {
      for (const g of groups) {
        await supabase
          .from("note_groups")
          .upsert({
            id: g.id,
            user_id: user.id,
            name: g.name,
            color: g.color,
            sort_order: g.sortOrder,
          } as any, { onConflict: "id" } as any);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [groups, user]);

  // Save folders to both localStorage and DB
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
    } catch (e) {
      console.warn("Could not save folders to localStorage");
    }
    if (!user) return;
    const timeout = setTimeout(async () => {
      for (const f of folders) {
        await supabase
          .from("note_folders")
          .upsert({
            id: f.id,
            user_id: user.id,
            group_id: f.groupId,
            name: f.name,
            sort_order: f.sortOrder,
          } as any, { onConflict: "id" } as any);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [folders, user]);

  // DB is source of truth — load from Supabase, fall back to localStorage cache
  useEffect(() => {
    if (!user?.id) {
      // No user — load from localStorage cache
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      setNotes(saved ? JSON.parse(saved) : SAMPLE_NOTES);
      setNotesLoaded(true);
      return;
    }
    const loadFromDb = async () => {
      const { data: dbNotes, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Failed to load notes from DB:", error);
        // Fall back to localStorage
        const saved = localStorage.getItem(STORAGE_KEY_NOTES);
        setNotes(saved ? JSON.parse(saved) : SAMPLE_NOTES);
        setNotesLoaded(true);
        return;
      }

      if (!dbNotes?.length) {
        // Check if there's localStorage data to migrate
        const saved = localStorage.getItem(STORAGE_KEY_NOTES);
        const localNotes: Note[] = saved ? JSON.parse(saved) : [];
        if (localNotes.length > 0 && localNotes[0].id !== "1") {
          // Migrate localStorage notes to DB
          for (const note of localNotes) {
            const category: "thoughts" | "creative" | "private" =
              note.groupId === "personal" ? "private" : note.groupId === "hobby" ? "creative" : "thoughts";
            await supabase.from("notes").upsert({
              id: note.id,
              user_id: user.id,
              title: note.title || "Untitled",
              content: note.contentRich || note.plainText,
              category,
              tags: note.tags,
              group_id: note.groupId || null,
              folder_id: note.folderId || null,
              is_pinned: note.isPinned || false,
              is_archived: note.isArchived || false,
              sort_order: note.sortOrder || 0,
              plain_text: note.plainText || null,
              skin: note.pageTheme && note.lineStyle ? JSON.stringify({ pageTheme: note.pageTheme, lineStyle: note.lineStyle }) : null,
              scribble_data: note.scribbleStrokes || null,
              created_at: note.createdAt,
              updated_at: note.updatedAt,
            });
          }
          setNotes(localNotes);
        } else {
          setNotes(SAMPLE_NOTES);
        }
        setNotesLoaded(true);
        return;
      }

      // Map DB notes to local Note shape
      const mapped: Note[] = dbNotes.map((dbNote: any) => ({
        id: dbNote.id,
        groupId: dbNote.group_id || (dbNote.category === "private" ? "personal" : dbNote.category === "creative" ? "hobby" : "inbox"),
        folderId: dbNote.folder_id || null,
        title: dbNote.title || "Untitled",
        contentRich: dbNote.content || "",
        plainText: dbNote.plain_text || dbNote.content?.replace(/<[^>]*>/g, "").substring(0, 500) || "",
        tags: dbNote.tags || [],
        createdAt: dbNote.created_at,
        updatedAt: dbNote.updated_at,
        isPinned: dbNote.is_pinned || false,
        isArchived: dbNote.is_archived || false,
        sortOrder: dbNote.sort_order || 0,
        scribbleStrokes: dbNote.scribble_data || undefined,
        ...(dbNote.skin ? (() => {
          try {
            const parsed = JSON.parse(dbNote.skin);
            return { pageTheme: parsed.pageTheme, lineStyle: parsed.lineStyle };
          } catch { return {}; }
        })() : {}),
      }));
      setNotes(mapped);
      setNotesLoaded(true);
    };
    loadFromDb();
  }, [user?.id]);

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

    // Extract first image from rich content for cover_image_url
    let coverImageUrl: string | null = null;
    if (note.contentRich) {
      // Try extracting from HTML img tags
      const imgMatch = note.contentRich.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch?.[1] && imgMatch[1].startsWith('http')) {
        coverImageUrl = imgMatch[1];
      }
      // Also try TipTap JSON image nodes
      if (!coverImageUrl) {
        try {
          const { extractImagesFromTiptapJSON } = await import("@/lib/editorUtils");
          const jsonImages = extractImagesFromTiptapJSON(note.contentRich);
          if (jsonImages.length > 0) coverImageUrl = jsonImages[0];
        } catch {}
      }
    }

    try {
      const { error } = await supabase.from("notes").upsert({
        id: note.id,
        user_id: user.id,
        title: note.title || "Untitled",
        content: note.contentRich || note.plainText,
        cover_image_url: coverImageUrl,
        category,
        tags: note.tags,
        group_id: note.groupId || null,
        folder_id: note.folderId || null,
        is_pinned: note.isPinned || false,
        is_archived: note.isArchived || false,
        sort_order: note.sortOrder || 0,
        plain_text: note.plainText || null,
        skin: note.pageTheme && note.lineStyle ? JSON.stringify({ pageTheme: note.pageTheme, lineStyle: note.lineStyle }) : null,
        scribble_data: note.scribbleStrokes || null,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
      });

      if (error) {
        console.error("Supabase sync error:", error);
        toast({
          title: "Couldn't sync note to Diary",
          description: error.message || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Supabase sync exception:", err);
      toast({
        title: "Couldn't sync note to Diary",
        description: err.message || "Please try saving again.",
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

  const handleReorderFolders = (groupId: string, reorderedFolders: NoteFolder[]) => {
    // Update folders with new sort order
    setFolders(
      folders.map((f) => {
        const updated = reorderedFolders.find((rf) => rf.id === f.id);
        return updated || f;
      }),
    );
  };

  const handleUpdateGroup = (updatedGroup: NoteGroup) => {
    setGroups(groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
  };

  const handleReorderGroups = (reorderedGroups: NoteGroup[]) => {
    // Update groups with new sort order
    setGroups(
      groups.map((g) => {
        const updated = reorderedGroups.find((rg) => rg.id === g.id);
        return updated || g;
      }),
    );
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

  // Mobile: full-screen editor rendered at the top level to avoid stacking context issues
  if (isMobile && viewMode === "editor" && selectedNote) {
    return (
      <MobileNoteEditor
        note={selectedNote}
        groups={groups}
        folders={folders}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        onBack={handleBackToOverview}
      />
    );
  }

  if (viewMode === "overview") {
    return (
      <div className="w-full flex-1 pb-24 relative min-h-screen">
        {/* Global Background */}
        {backgroundUrl && (
          <div className="fixed inset-0 z-0 pointer-events-none">
            {backgroundUrl.startsWith("linear-gradient") || backgroundUrl.startsWith("data:") ? (
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
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
                style={{ backgroundImage: `url("${backgroundUrl}")` }}
              />
            )}
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px]" />
          </div>
        )}

        <div className="relative z-10 w-full">
          <div className="w-full space-y-4 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-[1400px] mx-auto">
            {/* Page Header - Hidden on mobile, compact */}
            <div className="hidden md:block py-4">
              <p className="text-[10px] font-medium tracking-[0.3em] text-muted-foreground/70 uppercase mb-2">
                Life Atlas
              </p>
              <h1 className="text-4xl md:text-5xl font-light tracking-wide text-foreground">NOTES</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Your ideas, organized in one calm, premium view
              </p>
            </div>

            {/* Mobile: Compact header with title + New Note button */}
            <div className="md:hidden flex items-center justify-between py-2">
              <div>
                <h1 className="text-xl font-light tracking-wide text-foreground">NOTES</h1>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="h-8 px-3 rounded-lg bg-primary text-primary-foreground shadow-sm gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">New</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-lg p-1">
                  <DropdownMenuItem onClick={handleNewNoteWithOptions} className="py-2 rounded-lg cursor-pointer">
                    <FileText className="h-4 w-4 mr-3 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">New Note</span>
                      <span className="text-xs text-muted-foreground">Choose location</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleQuickNote} className="py-2 rounded-lg cursor-pointer">
                    <Zap className="h-4 w-4 mr-3 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Quick Note</span>
                      <span className="text-xs text-muted-foreground">Send to Inbox</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSettingsOpen(true)}
                    className="py-2 rounded-lg cursor-pointer"
                  >
                    <FolderPlus className="h-4 w-4 mr-3 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">New Group</span>
                      <span className="text-xs text-muted-foreground">Organize notes</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      // Open section creation - trigger on first group
                      if (sortedGroups.length > 0) {
                        const folderName = prompt("Section name:");
                        if (folderName?.trim()) handleCreateFolder(sortedGroups[0].id, folderName.trim());
                      }
                    }}
                    className="py-2 rounded-lg cursor-pointer"
                  >
                    <Layers className="h-4 w-4 mr-3 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">New Section</span>
                      <span className="text-xs text-muted-foreground">Add to first group</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile: Quick Stats as horizontal scrollable pills */}
            <div className="md:hidden overflow-x-auto no-scrollbar">
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Total", value: insights.total, icon: <FileText className="h-3 w-3" /> },
                  { label: "Today", value: insights.editedToday, icon: <Clock className="h-3 w-3" /> },
                  { label: "Pinned", value: insights.pinned, icon: <Pin className="h-3 w-3" /> },
                  { label: "Groups", value: insights.activeGroups, icon: <Layers className="h-3 w-3" /> },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 border border-border/50 backdrop-blur-sm whitespace-nowrap"
                  >
                    <span className="text-primary/60">{stat.icon}</span>
                    <span className="text-xs font-medium text-foreground">{stat.value}</span>
                    <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky Navigation & Toolbar */}
            <div className="sticky top-0 z-20 md:relative md:z-auto">
              {/* Glassmorphism toolbar container */}
              <div className="rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-sm md:bg-card md:backdrop-blur-none">
                {/* Mobile: View switcher hidden - only Atlas view on mobile */}
                <div className="p-2 md:hidden hidden">
                </div>
                {/* Mobile: Search + Sort collapsed row */}
                <div className="px-2 pb-2 md:pb-0 md:px-0 flex items-center gap-2 md:hidden">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="h-9 rounded-xl pl-9 pr-3 text-xs bg-muted/30 border-0 focus:bg-muted/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="h-9 rounded-xl w-[110px] text-xs bg-muted/30 border-0 hover:bg-muted/50 transition-colors gap-1">
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-xl">
                      <SelectItem value="updatedAt">Last edited</SelectItem>
                      <SelectItem value="createdAt">Created</SelectItem>
                      <SelectItem value="title">A–Z</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg hover:bg-muted/50 shrink-0"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {/* Desktop: Full toolbar row */}
                <div className="hidden md:flex p-2 items-center gap-2">
                  <NotesViewSwitcher currentView={notesView} onViewChange={setNotesView} />
                  <div className="relative flex-1 min-w-[140px] max-w-[280px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="h-10 rounded-xl pl-10 pr-4 text-sm bg-muted/30 border-0 focus:bg-muted/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="h-10 rounded-xl w-[140px] text-xs bg-muted/30 border-0 hover:bg-muted/50 transition-colors gap-2">
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-xl">
                      <SelectItem value="updatedAt">Last edited</SelectItem>
                      <SelectItem value="createdAt">Created</SelectItem>
                      <SelectItem value="title">A–Z</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          className="group relative h-9 px-4 rounded-lg overflow-hidden bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 text-white shadow-lg hover:shadow-xl transition-all duration-500 gap-2 border-0"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-slate-500 via-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                          <Plus className="h-4 w-4 relative z-10" />
                          <span className="text-xs uppercase tracking-wider font-semibold relative z-10">
                            New Note
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-80 relative z-10" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-lg p-1">
                        <DropdownMenuItem onClick={handleNewNoteWithOptions} className="py-2 rounded-lg cursor-pointer">
                          <FileText className="h-4 w-4 mr-3 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">New Note</span>
                            <span className="text-xs text-muted-foreground">Choose location</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleQuickNote} className="py-2 rounded-lg cursor-pointer">
                          <Zap className="h-4 w-4 mr-3 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Quick Note</span>
                            <span className="text-xs text-muted-foreground">Send to Inbox</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setSettingsOpen(true)}
                          className="py-2 rounded-lg cursor-pointer"
                        >
                          <FolderPlus className="h-4 w-4 mr-3 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">New Group</span>
                            <span className="text-xs text-muted-foreground">Organize notes</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (sortedGroups.length > 0) {
                              const folderName = prompt("Section name:");
                              if (folderName?.trim()) handleCreateFolder(sortedGroups[0].id, folderName.trim());
                            }
                          }}
                          className="py-2 rounded-lg cursor-pointer"
                        >
                          <Layers className="h-4 w-4 mr-3 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">New Section</span>
                            <span className="text-xs text-muted-foreground">Add to first group</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg hover:bg-muted/50 transition-all"
                          title="More options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 rounded-lg p-2">
                        {/* Settings */}
                        <DropdownMenuItem
                          onClick={() => setSettingsOpen(true)}
                          className="py-2 rounded-lg cursor-pointer"
                        >
                          <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
                          <span>Group Settings</span>
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

                {/* Filter chips - Minimal underline tabs */}
                <div className="px-3 pb-2 border-b border-border/30">
                  <div className="flex gap-1 overflow-auto no-scrollbar">
                    <button
                      onClick={() => setFilterGroupId("all")}
                      className={cn(
                        "h-9 px-4 text-xs font-medium whitespace-nowrap transition-all relative",
                        filterGroupId === "all" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      All
                      {filterGroupId === "all" && (
                        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground rounded-full" />
                      )}
                    </button>

                    {sortedGroups.map((group) => {
                      const active = filterGroupId === group.id;
                      return (
                        <button
                          key={group.id}
                          onClick={() => setFilterGroupId(group.id)}
                          className={cn(
                            "h-9 px-4 text-xs font-medium whitespace-nowrap transition-all relative",
                            active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {group.name}
                          {active && (
                            <span
                              className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Insights Section - Desktop only (mobile has pill row above) */}
            <div className="hidden md:block rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 p-3">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  Quick Stats
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-border/30 to-transparent" />
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-2">
                {[
                  { label: "Total notes", value: insights.total, icon: <FileText className="h-4 w-4" /> },
                  { label: "Edited today", value: insights.editedToday, icon: <Clock className="h-4 w-4" /> },
                  { label: "Pinned", value: insights.pinned, icon: <Pin className="h-4 w-4" /> },
                  { label: "Active groups", value: insights.activeGroups, icon: <Layers className="h-4 w-4" /> },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2.5 py-1">
                    <div className="h-7 w-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary/60 shrink-0">
                      {stat.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/50">{stat.label}</p>
                      <p className="text-base font-light text-foreground leading-tight">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            {notesView === "atlas" && (
              <div className="space-y-4">
                {/* Section header */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Your Groups
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-border/30 to-transparent" />
                </div>
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
                      onUpdateGroup={handleUpdateGroup}
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
                  onReorderFolders={handleReorderFolders}
                  onReorderGroups={handleReorderGroups}
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
