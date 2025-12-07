import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Lightbulb, Palette, Lock, Trash2, Mic, MicOff, Pencil, Type, Search, ListChecks, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string | null;
  category: string;
  tags: string[];
  skin: string;
  has_checklist: boolean;
  scribble_data: string | null;
  voice_transcript: string | null;
  created_at: string;
  updated_at: string;
}

const categories = [
  { id: "thoughts", label: "Thoughts/Ideas", icon: Lightbulb },
  { id: "creative", label: "Creative Space", icon: Palette },
  { id: "private", label: "Private Notes", icon: Lock },
];

const skins = [
  { id: "default", label: "Default", bg: "bg-card" },
  { id: "lined", label: "Lined Paper", bg: "bg-[linear-gradient(#e5e5e5_1px,transparent_1px)] bg-[size:100%_28px]" },
  { id: "grid", label: "Grid", bg: "bg-[linear-gradient(#e5e5e5_1px,transparent_1px),linear-gradient(90deg,#e5e5e5_1px,transparent_1px)] bg-[size:20px_20px]" },
  { id: "cream", label: "Cream", bg: "bg-amber-50 dark:bg-amber-950/20" },
  { id: "blue", label: "Blue Tint", bg: "bg-blue-50 dark:bg-blue-950/20" },
];

export default function Notes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [activeCategory, setActiveCategory] = useState("thoughts");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [skin, setSkin] = useState("default");
  const [hasChecklist, setHasChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [inputMode, setInputMode] = useState<"type" | "voice" | "scribble">("type");
  const [saving, setSaving] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Scribble canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
    setLoading(false);
  };

  const openDialog = (note?: Note) => {
    if (note) {
      setSelectedNote(note);
      setTitle(note.title);
      setContent(note.content || "");
      setTags(note.tags?.join(", ") || "");
      setSkin(note.skin || "default");
      setHasChecklist(note.has_checklist || false);
      setVoiceTranscript(note.voice_transcript || "");
      setActiveCategory(note.category);
      
      // Parse checklist from content if exists
      if (note.has_checklist && note.content) {
        try {
          const parsed = JSON.parse(note.content);
          if (Array.isArray(parsed)) {
            setChecklistItems(parsed);
          }
        } catch {
          setChecklistItems([]);
        }
      }
    } else {
      setSelectedNote(null);
      setTitle("");
      setContent("");
      setTags("");
      setSkin("default");
      setHasChecklist(false);
      setChecklistItems([]);
      setVoiceTranscript("");
      setInputMode("type");
    }
    setDialogOpen(true);
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklistItems([
      ...checklistItems,
      { id: crypto.randomUUID(), text: newChecklistItem, checked: false },
    ]);
    setNewChecklistItem("");
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const saveNote = async () => {
    if (!user) return;

    setSaving(true);
    const tagsList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const canvasData = canvasRef.current?.toDataURL() || null;

    const noteContent = hasChecklist ? JSON.stringify(checklistItems) : content;

    const noteData = {
      title: title || "Untitled",
      content: noteContent,
      category: activeCategory,
      tags: tagsList,
      skin,
      has_checklist: hasChecklist,
      scribble_data: inputMode === "scribble" ? canvasData : selectedNote?.scribble_data,
      voice_transcript: voiceTranscript || selectedNote?.voice_transcript,
    };

    if (selectedNote) {
      const { error } = await supabase
        .from("notes")
        .update(noteData)
        .eq("id", selectedNote.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update note", variant: "destructive" });
      } else {
        toast({ title: "Saved!", description: "Your note has been updated" });
        fetchNotes();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        ...noteData,
      });

      if (error) {
        toast({ title: "Error", description: "Failed to create note", variant: "destructive" });
      } else {
        toast({ title: "Created!", description: "Your note has been created" });
        fetchNotes();
        setDialogOpen(false);
      }
    }

    setSaving(false);
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (!error) {
      fetchNotes();
      toast({ title: "Deleted", description: "Note has been removed" });
      setDialogOpen(false);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setVoiceTranscript("Voice note recorded. Transcription will be available soon.");
        toast({ title: "Recorded!", description: "Your voice note has been captured" });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({ title: "Error", description: "Could not access microphone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const filteredNotes = notes.filter((note) => {
    const matchesCategory = note.category === activeCategory;
    const matchesSearch = searchQuery
      ? note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCategory && matchesSearch;
  });

  const getSkinClass = (skinId: string) => {
    return skins.find((s) => s.id === skinId)?.bg || "bg-card";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground mt-1">Capture your thoughts, ideas, and more</p>
        </div>

        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
        <TabsList>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              <category.icon className="h-4 w-4 mr-2" />
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            {filteredNotes.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <category.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No notes yet</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  Create your first {category.label.toLowerCase()} note.
                </p>
                <Button onClick={() => openDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${getSkinClass(note.skin)}`}
                    onClick={() => openDialog(note)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {note.has_checklist && <ListChecks className="h-4 w-4 text-primary" />}
                        <CardTitle className="text-base line-clamp-1">{note.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {note.has_checklist ? (
                        <div className="space-y-1">
                          {(() => {
                            try {
                              const items = JSON.parse(note.content || "[]") as ChecklistItem[];
                              return items.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                  <Checkbox checked={item.checked} disabled className="h-3 w-3" />
                                  <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                                    {item.text}
                                  </span>
                                </div>
                              ));
                            } catch {
                              return null;
                            }
                          })()}
                        </div>
                      ) : (
                        note.content && (
                          <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                        )
                      )}
                      {note.scribble_data && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Pencil className="h-3 w-3" />
                          Contains sketch
                        </div>
                      )}
                      {note.voice_transcript && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mic className="h-3 w-3" />
                          Voice note
                        </div>
                      )}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${getSkinClass(skin)}`}>
          <DialogHeader>
            <DialogTitle>{selectedNote ? "Edit Note" : "New Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="text-lg font-medium bg-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={inputMode === "type" ? "default" : "outline"}
                size="sm"
                onClick={() => { setInputMode("type"); setHasChecklist(false); }}
              >
                <Type className="h-4 w-4 mr-1" />
                Type
              </Button>
              <Button
                variant={inputMode === "voice" ? "default" : "outline"}
                size="sm"
                onClick={() => { setInputMode("voice"); setHasChecklist(false); }}
              >
                <Mic className="h-4 w-4 mr-1" />
                Voice
              </Button>
              <Button
                variant={inputMode === "scribble" ? "default" : "outline"}
                size="sm"
                onClick={() => { setInputMode("scribble"); setHasChecklist(false); }}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Scribble
              </Button>
              <Button
                variant={hasChecklist ? "default" : "outline"}
                size="sm"
                onClick={() => { setHasChecklist(!hasChecklist); setInputMode("type"); }}
              >
                <ListChecks className="h-4 w-4 mr-1" />
                Checklist
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Page Skin</label>
                <Select value={skin} onValueChange={setSkin}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {skins.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasChecklist ? (
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                    />
                    <span className={`flex-1 ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                      {item.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChecklistItem(item.id)}
                      className="h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Add item..."
                    onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                  />
                  <Button onClick={addChecklistItem} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : inputMode === "type" ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts..."
                rows={10}
                className="resize-none bg-transparent"
              />
            ) : inputMode === "voice" ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={isRecording ? stopRecording : startRecording}
                    className="h-20 w-20 rounded-full"
                  >
                    {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                </p>
                {voiceTranscript && (
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm">{voiceTranscript}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border border-border rounded-lg overflow-hidden bg-card">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={300}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full cursor-crosshair"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={clearCanvas}>
                  Clear Canvas
                </Button>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Tags (comma separated)</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ideas, work, personal..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveNote} disabled={saving} className="flex-1">
                {saving ? "Saving..." : selectedNote ? "Update Note" : "Create Note"}
              </Button>
              {selectedNote && (
                <Button variant="destructive" onClick={() => deleteNote(selectedNote.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
