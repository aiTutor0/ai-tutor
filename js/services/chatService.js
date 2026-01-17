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
 * Get all level test results (for teachers) - only from students in same group rooms
 */
export async function getAllLevelTestResults() {
    if (!supabase) return { data: [], error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: "Not authenticated" } };

    try {
        // Get current user's email
        const currentEmail = user.email?.toLowerCase();
        if (!currentEmail) return { data: [], error: { message: "No email found" } };

        // Step 1: Find all rooms where the teacher is a member (case-insensitive)
        const { data: teacherRooms, error: roomError } = await supabase
            .from('room_members')
            .select('room_id')
            .ilike('member_email', currentEmail);

        if (roomError || !teacherRooms || teacherRooms.length === 0) {
            // Teacher is not in any rooms, return empty
            return { data: [], error: null };
        }

        const roomIds = teacherRooms.map(r => r.room_id);

        // Step 2: Get all members of those rooms
        const { data: roomMembers, error: membersError } = await supabase
            .from('room_members')
            .select('member_email')
            .in('room_id', roomIds)
            .neq('member_email', currentEmail); // Exclude the teacher themselves

        if (membersError || !roomMembers) {
            return { data: [], error: null };
        }

        // Get unique student emails
        const studentEmails = [...new Set(roomMembers.map(m => m.member_email.toLowerCase()))];

        if (studentEmails.length === 0) {
            return { data: [], error: null };
        }

        // Step 3: Get ALL profiles and filter manually (case-insensitive matching)
        const { data: allProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name');

        if (profilesError || !allProfiles) {
            return { data: [], error: null };
        }

        // Filter profiles by matching emails (case-insensitive)
        const profiles = allProfiles.filter(p =>
            p.email && studentEmails.includes(p.email.toLowerCase())
        );

        if (profiles.length === 0) {
            return { data: [], error: null };
        }

        const studentUserIds = profiles.map(p => p.id);

        // Create a map for quick lookup
        const profileMap = {};
        profiles.forEach(p => {
            profileMap[p.id] = { email: p.email, full_name: p.full_name };
        });

        // Step 4: Get level test results only for students in shared rooms
        const { data, error } = await supabase
            .from('level_test_results')
            .select('*')
            .in('user_id', studentUserIds)
            .order('created_at', { ascending: false });

        if (error) {
            return { data: [], error };
        }

        // Add profile info to results
        const resultsWithProfiles = (data || []).map(r => ({
            ...r,
            profiles: profileMap[r.user_id] || { email: 'Unknown', full_name: 'Student' }
        }));

        return { data: resultsWithProfiles, error: null };
    } catch (err) {
        console.error('Error fetching level test results:', err);
        return { data: [], error: { message: err.message } };
    }
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
