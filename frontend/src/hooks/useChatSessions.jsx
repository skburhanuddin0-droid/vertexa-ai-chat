import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadSessions, saveSessions, clearOldSessions } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';
import { api } from '../utils/api';

// hook that encapsulates session management logic
// Fully scoped per-user: each user only sees their own chat history
export default function useChatSessions() {
  const [sessions, setSessions] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Get current user ID on mount
  useEffect(() => {
    // Clean up old unscoped localStorage data
    clearOldSessions();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });
  }, []);

  // Load sessions when we know the user
  useEffect(() => {
    if (!userId) return;

    async function loadUserSessions() {
      console.log('[DEBUG] Loading sessions for user:', userId);
      const localData = loadSessions(userId);

      try {
        if (import.meta.env.VITE_SUPABASE_URL) {
          // Fetch this user's chats from Supabase
          const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

          console.log('[DEBUG] Supabase query result:', { error, chatCount: data?.length, firstRow: data?.[0] });

          if (error) {
            console.error('[DEBUG] Supabase query error:', error);
          }

          if (!error && data && data.length > 0) {
            const grouped = {};
            data.forEach(row => {
              const sid = row.session_id;
              if (!grouped[sid]) grouped[sid] = { id: sid, messages: [] };
              grouped[sid].messages.push({ role: row.role, content: row.content });
            });

            console.log('[DEBUG] Setting sessions from Supabase:', Object.keys(grouped).length, 'sessions');
            setSessions(grouped);
            setLoaded(true);
            return;
          }
        }
      } catch (err) {
        console.error('[DEBUG] Failed to load sessions from Supabase', err);
      }

      // Fallback to local data
      console.log('[DEBUG] Using local data, sessions:', Object.keys(localData).length);
      setSessions(localData);
      setLoaded(true);
    }

    loadUserSessions();
  }, [userId]);

  // Persist sessions to localStorage (scoped by user) whenever they change
  useEffect(() => {
    if (userId && loaded) {
      saveSessions(sessions, userId);
    }
  }, [sessions, userId, loaded]);

  const createSession = () => {
    const id = uuidv4();
    setSessions(prev => ({
      ...prev,
      [id]: { id, messages: [] },
    }));
    setActiveId(id);
    return id;
  };

  const deleteSession = id => {
    setSessions(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (activeId === id) {
      setActiveId(null);
    }
    // Remove from Supabase (scoped to this user)
    if (import.meta.env.VITE_SUPABASE_URL && userId) {
      supabase.from('chats').delete()
        .eq('session_id', id)
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.error('Failed to delete session from Supabase', error);
        });
    }
    // Inform backend
    api.delete(`/sessions/${id}`).catch(err => console.error(err));
  };

  const addMessage = (sessionId, message) => {
    setSessions(prev => {
      const session = prev[sessionId];
      if (!session) return prev;
      return {
        ...prev,
        [sessionId]: {
          ...session,
          messages: [...(session.messages || []), message],
        },
      };
    });
  };

  return {
    sessions,
    activeId,
    setActiveId,
    createSession,
    deleteSession,
    addMessage,
    userId,
    loaded,
  };
}