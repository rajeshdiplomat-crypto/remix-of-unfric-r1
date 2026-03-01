import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";
import type { FeedEvent, FeedReaction, FeedComment, FeedSave, SourceModule, FeedEventType } from "./types";

interface UseFeedEventsResult {
  events: FeedEvent[];
  reactions: Record<string, FeedReaction[]>;
  comments: Record<string, FeedComment[]>;
  saves: Set<string>;
  loading: boolean;
  filter: SourceModule | 'all' | 'saved';
  setFilter: (filter: SourceModule | 'all' | 'saved') => void;
  toggleReaction: (eventId: string, emoji: string) => Promise<void>;
  addComment: (eventId: string, text: string, parentId?: string) => Promise<void>;
  editComment: (commentId: string, text: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleSave: (eventId: string) => Promise<void>;
  refetch: () => void;
  createFeedEvent: (event: Omit<FeedEvent, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
}

export function useFeedEvents(userId: string | undefined): UseFeedEventsResult {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [reactions, setReactions] = useState<Record<string, FeedReaction[]>>({});
  const [comments, setComments] = useState<Record<string, FeedComment[]>>({});
  const [saves, setSaves] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SourceModule | 'all' | 'saved'>('all');

  const fetchEvents = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const { data: res, error } = await supabase.functions.invoke("manage-feed", {
        body: { action: "fetch_events", filter }
      });

      if (error) throw error;
      
      const { events: eventsData, reactions: reactionsData, comments: commentsData, saves: savesData } = res?.data || {};

      const filteredEvents = eventsData || [];

      const mappedEvents = filteredEvents.map((e: any) => ({
        ...e,
        type: e.type as FeedEventType,
        source_module: e.source_module as SourceModule,
        media: Array.isArray(e.media) ? e.media as string[] : [],
        metadata: (e.metadata || {}) as Record<string, any>,
      }));
      setEvents(mappedEvents);

      // Seed React Query cache so IDB persister can write it
      queryClient.setQueryData(['feed-events', userId, filter], mappedEvents);
      console.log(`[FeedEvents] 💾 Seeded query cache with ${mappedEvents.length} events`);

      if (filteredEvents.length > 0) {
        const reactionsMap: Record<string, FeedReaction[]> = {};
        (reactionsData || []).forEach((r: any) => {
          if (!reactionsMap[r.feed_event_id]) reactionsMap[r.feed_event_id] = [];
          reactionsMap[r.feed_event_id].push(r);
        });
        setReactions(reactionsMap);

        const commentsMap: Record<string, FeedComment[]> = {};
        (commentsData || []).forEach((c: any) => {
          if (!commentsMap[c.feed_event_id]) commentsMap[c.feed_event_id] = [];
          commentsMap[c.feed_event_id].push(c);
        });
        setComments(commentsMap);
        
        setSaves(new Set((savesData || []).map((s: any) => s.feed_event_id)));
      }
    } catch (error) {
      console.error("Error fetching feed events:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const toggleReaction = async (eventId: string, emoji: string) => {
    if (!userId) return;

    const { data: res, error } = await supabase.functions.invoke("manage-feed", {
      body: { action: "toggle_reaction", eventId, emoji }
    });
    
    if (error || !res?.success) return;

    const result = res.data;
    const existingReaction = reactions[eventId]?.find(r => r.user_id === userId);

    if (result.action === 'removed' && existingReaction) {
      setReactions(prev => ({
        ...prev,
        [eventId]: prev[eventId]?.filter(r => r.id !== existingReaction.id) || [],
      }));
    } else if (result.action === 'updated' && existingReaction) {
      setReactions(prev => ({
        ...prev,
        [eventId]: prev[eventId]?.map(r => r.id === existingReaction.id ? { ...r, emoji } : r) || [],
      }));
    } else if (result.action === 'added') {
      setReactions(prev => ({
        ...prev,
        [eventId]: [...(prev[eventId] || []), result.data],
      }));
    }
  };

  const addComment = async (eventId: string, text: string, parentId?: string) => {
    if (!userId || !text.trim()) return;

    const { data: res } = await supabase.functions.invoke("manage-feed", {
      body: { action: "add_comment", eventId, text, parentId }
    });

    const data = res?.data;
    if (data) {
      setComments(prev => ({
        ...prev,
        [eventId]: [...(prev[eventId] || []), data],
      }));
    }
  };

  const editComment = async (commentId: string, text: string) => {
    if (!text.trim()) return;

    await supabase.functions.invoke("manage-feed", {
      body: { action: "edit_comment", commentId, text }
    });

    setComments(prev => {
      const newComments = { ...prev };
      Object.keys(newComments).forEach(eventId => {
        newComments[eventId] = newComments[eventId].map(c =>
          c.id === commentId ? { ...c, text: text.trim(), is_edited: true } : c
        );
      });
      return newComments;
    });
  };

  const deleteComment = async (commentId: string) => {
    await supabase.functions.invoke("manage-feed", {
      body: { action: "delete_comment", commentId }
    });

    setComments(prev => {
      const newComments = { ...prev };
      Object.keys(newComments).forEach(eventId => {
        newComments[eventId] = newComments[eventId].filter(c => c.id !== commentId);
      });
      return newComments;
    });
  };

  const toggleSave = async (eventId: string) => {
    if (!userId) return;

    const { data: res } = await supabase.functions.invoke("manage-feed", {
      body: { action: "toggle_save", eventId }
    });
    
    if (res?.data?.action === 'removed') {
      setSaves(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    } else if (res?.data?.action === 'added') {
      setSaves(prev => new Set(prev).add(eventId));
    }
  };

  const createFeedEvent = async (event: Omit<FeedEvent, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return;

    const { data: res } = await supabase.functions.invoke("manage-feed", {
      body: { action: "create_event", event }
    });

    const data = res?.data;

    if (data) {
      setEvents(prev => [{
        ...data,
        type: data.type as FeedEventType,
        source_module: data.source_module as SourceModule,
        media: Array.isArray(data.media) ? data.media as string[] : [],
        metadata: (data.metadata || {}) as Record<string, any>,
      }, ...prev]);
    }
  };

  return {
    events,
    reactions,
    comments,
    saves,
    loading,
    filter,
    setFilter,
    toggleReaction,
    addComment,
    editComment,
    deleteComment,
    toggleSave,
    refetch: fetchEvents,
    createFeedEvent,
  };
}
