// js/services/chatService.js
import { supabase } from "../config/supabaseClient.js";

// ======================================
// CHAT SESSIONS
// ======================================

/**
 * Get all chat sessions for the current user
 */
export async function getChatSessions() {
    if (!supabase) return { data: [], error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

    return { data: data || [], error };
}

/**
 * Get a specific chat session by ID
 */
export async function getChatSession(sessionId) {
    if (!supabase) return { data: null, error: null };

    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    return { data, error };
}

/**
 * Create a new chat session
 */
export async function createChatSession(title, mode = 'chat') {
    if (!supabase) return { data: null, error: { message: "Supabase bağlı değil (demo)" } };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from('chat_sessions')
        .insert([
            {
                user_id: user.id,
                title: title,
                mode: mode,
                manual_title: false
            }
        ])
        .select()
        .single();

    return { data, error };
}

/**
 * Update a chat session
 */
export async function updateChatSession(sessionId, updates) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { error } = await supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId);

    return { error };
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

    return { error };
}

// ======================================
// MESSAGES
// ======================================

/**
 * Get all messages for a chat session
 */
export async function getMessages(sessionId) {
    if (!supabase) return { data: [], error: null };

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_session_id', sessionId)
        .order('created_at', { ascending: true });

    return { data: data || [], error };
}

/**
 * Add a message to a chat session
 */
export async function addMessage(sessionId, role, content, attachments = []) {
    if (!supabase) return { data: null, error: { message: "Supabase bağlı değil (demo)" } };

    const { data, error } = await supabase
        .from('messages')
        .insert([
            {
                chat_session_id: sessionId,
                role: role,
                content: content,
                attachments: attachments,
                edited: false
            }
        ])
        .select()
        .single();

    // Update session's updated_at timestamp
    if (!error) {
        await supabase
            .from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);
    }

    return { data, error };
}

/**
 * Update a message
 */
export async function updateMessage(messageId, content) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { error } = await supabase
        .from('messages')
        .update({
            content: content,
            edited: true
        })
        .eq('id', messageId);

    return { error };
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

    return { error };
}

/**
 * Subscribe to new messages in a chat session (real-time)
 */
export function subscribeToMessages(sessionId, callback) {
    if (!supabase) return () => { };

    const channel = supabase
        .channel(`chat_${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `chat_session_id=eq.${sessionId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

// ======================================
// LEVEL TEST RESULTS
// ======================================

/**
 * Save level test result
 */
export async function saveLevelTestResult(level, description, score, answers) {
    if (!supabase) return { data: null, error: { message: "Supabase bağlı değil (demo)" } };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from('level_test_results')
        .insert([
            {
                user_id: user.id,
                level: level,
                description: description,
                score: score,
                answers: answers
            }
        ])
        .select()
        .single();

    return { data, error };
}

/**
 * Get level test results for current user
 */
export async function getLevelTestResults() {
    if (!supabase) return { data: [], error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from('level_test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}

/**
 * Get all level test results (for teachers) - includes student info
 */
export async function getAllLevelTestResults() {
    if (!supabase) return { data: [], error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: "Not authenticated" } };

    // Check if user is teacher
    const role = user.user_metadata?.role;
    if (role !== 'teacher') {
        return { data: [], error: { message: "Only teachers can view all results" } };
    }

    // Get all level test results with user info
    const { data, error } = await supabase
        .from('level_test_results')
        .select(`
            *,
            profiles:user_id (
                email,
                full_name
            )
        `)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}

// ======================================
// SCHEDULED SESSIONS
// ======================================

/**
 * Create a scheduled session
 */
export async function createScheduledSession(topic, scheduledDate, notes = '') {
    if (!supabase) return { data: null, error: { message: "Supabase bağlı değil (demo)" } };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from('scheduled_sessions')
        .insert([
            {
                student_id: user.id,
                topic: topic,
                scheduled_date: scheduledDate,
                notes: notes,
                status: 'pending'
            }
        ])
        .select()
        .single();

    return { data, error };
}

/**
 * Get scheduled sessions for current user
 */
export async function getScheduledSessions() {
    if (!supabase) return { data: [], error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*')
        .eq('student_id', user.id)
        .order('scheduled_date', { ascending: true });

    return { data: data || [], error };
}

/**
 * Update scheduled session status
 */
export async function updateScheduledSession(sessionId, updates) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { error } = await supabase
        .from('scheduled_sessions')
        .update(updates)
        .eq('id', sessionId);

    return { error };
}

/**
 * Delete a scheduled session
 */
export async function deleteScheduledSession(sessionId) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { error } = await supabase
        .from('scheduled_sessions')
        .delete()
        .eq('id', sessionId);

    return { error };
}

// ======================================
// USER PREFERENCES
// ======================================

/**
 * Get user preferences
 */
export async function getUserPreferences() {
    if (!supabase) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

    return { data, error };
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(preferences) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    const { error } = await supabase
        .from('user_preferences')
        .upsert({
            user_id: user.id,
            ...preferences
        });

    return { error };
}
