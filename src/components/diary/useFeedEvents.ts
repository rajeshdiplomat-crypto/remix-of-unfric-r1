import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      let query = supabase
        .from("feed_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter !== 'all' && filter !== 'saved') {
        query = query.eq("source_module", filter);
      }

      const { data: eventsData } = await query;
      
      let filteredEvents = eventsData || [];
      
      if (filter === 'saved') {
        const { data: savesData } = await supabase
          .from("feed_saves")
          .select("feed_event_id")
          .eq("user_id", userId);
        
        const savedIds = new Set((savesData || []).map(s => s.feed_event_id));
        filteredEvents = filteredEvents.filter(e => savedIds.has(e.id));
      }

      setEvents(filteredEvents.map(e => ({
        ...e,
        type: e.type as FeedEventType,
        source_module: e.source_module as SourceModule,
        media: Array.isArray(e.media) ? e.media as string[] : [],
        metadata: (e.metadata || {}) as Record<string, any>,
      })));

      if (filteredEvents.length > 0) {
        const eventIds = filteredEvents.map(e => e.id);
        
        const { data: reactionsData } = await supabase
          .from("feed_reactions")
          .select("*")
          .in("feed_event_id", eventIds);

        const reactionsMap: Record<string, FeedReaction[]> = {};
        (reactionsData || []).forEach(r => {
          if (!reactionsMap[r.feed_event_id]) reactionsMap[r.feed_event_id] = [];
          reactionsMap[r.feed_event_id].push(r);
        });
        setReactions(reactionsMap);

        const { data: commentsData } = await supabase
          .from("feed_comments")
          .select("*")
          .in("feed_event_id", eventIds)
          .order("created_at", { ascending: true });

        const commentsMap: Record<string, FeedComment[]> = {};
        (commentsData || []).forEach(c => {
          if (!commentsMap[c.feed_event_id]) commentsMap[c.feed_event_id] = [];
          commentsMap[c.feed_event_id].push(c);
        });
        setComments(commentsMap);

        const { data: savesData } = await supabase
          .from("feed_saves")
          .select("feed_event_id")
          .eq("user_id", userId);
        
        setSaves(new Set((savesData || []).map(s => s.feed_event_id)));
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

    const existingReaction = reactions[eventId]?.find(r => r.user_id === userId);

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        await supabase.from("feed_reactions").delete().eq("id", existingReaction.id);
        setReactions(prev => ({
          ...prev,
          [eventId]: prev[eventId]?.filter(r => r.id !== existingReaction.id) || [],
        }));
      } else {
        await supabase.from("feed_reactions").update({ emoji }).eq("id", existingReaction.id);
        setReactions(prev => ({
          ...prev,
          [eventId]: prev[eventId]?.map(r => r.id === existingReaction.id ? { ...r, emoji } : r) || [],
        }));
      }
    } else {
      const { data } = await supabase
        .from("feed_reactions")
        .insert({ user_id: userId, feed_event_id: eventId, emoji })
        .select()
        .single();
      
      if (data) {
        setReactions(prev => ({
          ...prev,
          [eventId]: [...(prev[eventId] || []), data],
        }));
      }
    }
  };

  const addComment = async (eventId: string, text: string, parentId?: string) => {
    if (!userId || !text.trim()) return;

    const { data } = await supabase
      .from("feed_comments")
      .insert({
        user_id: userId,
        feed_event_id: eventId,
        parent_comment_id: parentId || null,
        text: text.trim(),
      })
      .select()
      .single();

    if (data) {
      setComments(prev => ({
        ...prev,
        [eventId]: [...(prev[eventId] || []), data],
      }));
    }
  };

  const editComment = async (commentId: string, text: string) => {
    if (!text.trim()) return;

    await supabase
      .from("feed_comments")
      .update({ text: text.trim(), is_edited: true })
      .eq("id", commentId);

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
    await supabase.from("feed_comments").delete().eq("id", commentId);

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

    if (saves.has(eventId)) {
      await supabase.from("feed_saves").delete().eq("user_id", userId).eq("feed_event_id", eventId);
      setSaves(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    } else {
      await supabase.from("feed_saves").insert({ user_id: userId, feed_event_id: eventId });
      setSaves(prev => new Set(prev).add(eventId));
    }
  };

  const createFeedEvent = async (event: Omit<FeedEvent, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return;

    const { data } = await supabase
      .from("feed_events")
      .insert({ ...event, user_id: userId })
      .select()
      .single();

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
