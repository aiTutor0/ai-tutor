// js/services/roomService.js
import { supabase } from "../config/supabaseClient.js";

// ======================================
// GROUP ROOMS
// ======================================

/**
 * Get all rooms that the current user is a member of
 */
export async function getUserRooms() {
    if (!supabase) return { data: [], error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: "Not authenticated" } };

    // Get rooms where user is a member
    const { data, error } = await supabase
        .from('room_members')
        .select(`
      room_id,
      group_rooms (
        id,
        name,
        description,
        creator_id,
        created_at
      )
    `)
        .eq('user_id', user.id);

    if (error) return { data: [], error };

    // Transform data to flat structure
    const rooms = data.map(item => item.group_rooms).filter(Boolean);
    return { data: rooms, error: null };
}

/**
 * Create a new group room
 */
export async function createRoom(name, description = '') {
    if (!supabase) return { data: null, error: { message: "Supabase bağlı değil (demo)" } };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    // Create the room
    const { data: room, error: roomError } = await supabase
        .from('group_rooms')
        .insert([
            {
                name: name,
                description: description,
                creator_id: user.id
            }
        ])
        .select()
        .single();

    if (roomError) return { data: null, error: roomError };

    // Add creator as first member
    const { error: memberError } = await supabase
        .from('room_members')
        .insert([
            {
                room_id: room.id,
                user_id: user.id
            }
        ]);

    if (memberError) return { data: null, error: memberError };

    return { data: room, error: null };
}

/**
 * Delete a room (only creator can delete)
 */
export async function deleteRoom(roomId) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { error } = await supabase
        .from('group_rooms')
        .delete()
        .eq('id', roomId);

    return { error };
}

// ======================================
// ROOM MEMBERS
// ======================================

/**
 * Get all members of a room
 */
export async function getRoomMembers(roomId) {
    if (!supabase) return { data: [], error: null };

    const { data, error } = await supabase
        .from('room_members')
        .select(`
      user_id,
      joined_at,
      users (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
        .eq('room_id', roomId);

    if (error) return { data: [], error };

    // Transform data
    const members = data.map(item => ({
        ...item.users,
        joined_at: item.joined_at
    }));

    return { data: members, error: null };
}

/**
 * Add a member to a room
 */
export async function addRoomMember(roomId, userId) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { error } = await supabase
        .from('room_members')
        .insert([
            {
                room_id: roomId,
                user_id: userId
            }
        ]);

    return { error };
}

/**
 * Remove a member from a room
 */
export async function removeRoomMember(roomId, userId) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

    return { error };
}

// ======================================
// ROOM MESSAGES
// ======================================

/**
 * Get all messages in a room
 */
export async function getRoomMessages(roomId) {
    if (!supabase) return { data: [], error: null };

    const { data, error } = await supabase
        .from('room_messages')
        .select(`
      id,
      content,
      created_at,
      user_id,
      users (
        email,
        full_name,
        avatar_url
      )
    `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

    if (error) return { data: [], error };

    return { data, error: null };
}

/**
 * Send a message to a room
 */
export async function sendRoomMessage(roomId, content) {
    if (!supabase) return { data: null, error: { message: "Supabase bağlı değil (demo)" } };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from('room_messages')
        .insert([
            {
                room_id: roomId,
                user_id: user.id,
                content: content
            }
        ])
        .select()
        .single();

    return { data, error };
}

/**
 * Delete a message (only message author can delete)
 */
export async function deleteRoomMessage(messageId) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { error } = await supabase
        .from('room_messages')
        .delete()
        .eq('id', messageId);

    return { error };
}

/**
 * Subscribe to new messages in a room (real-time)
 */
export function subscribeToRoomMessages(roomId, callback) {
    if (!supabase) return () => { };

    const channel = supabase
        .channel(`room_${roomId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'room_messages',
                filter: `room_id=eq.${roomId}`
            },
            async (payload) => {
                // Fetch user info for the new message
                const { data: user } = await supabase
                    .from('users')
                    .select('email, full_name, avatar_url')
                    .eq('id', payload.new.user_id)
                    .single();

                callback({
                    ...payload.new,
                    users: user
                });
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

// ======================================
// ROOM INVITATIONS
// ======================================

/**
 * Get invitations for current user
 */
export async function getMyInvitations() {
    if (!supabase) return { data: [], error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: "Not authenticated" } };

    // Get user's email
    const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single();

    if (!userData) return { data: [], error: null };

    const { data, error } = await supabase
        .from('room_invitations')
        .select(`
      id,
      status,
      created_at,
      room_id,
      group_rooms (
        id,
        name,
        description
      ),
      from_user:users!room_invitations_from_user_id_fkey (
        email,
        full_name
      )
    `)
        .eq('to_email', userData.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) return { data: [], error };

    return { data, error: null };
}

/**
 * Send an invitation to join a room
 */
export async function inviteToRoom(roomId, toEmail) {
    if (!supabase) return { data: null, error: { message: "Supabase bağlı değil (demo)" } };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from('room_invitations')
        .insert([
            {
                room_id: roomId,
                from_user_id: user.id,
                to_email: toEmail,
                status: 'pending'
            }
        ])
        .select()
        .single();

    return { data, error };
}

/**
 * Accept a room invitation
 */
export async function acceptInvitation(invitationId) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    // Get invitation details
    const { data: invitation, error: invError } = await supabase
        .from('room_invitations')
        .select('room_id')
        .eq('id', invitationId)
        .single();

    if (invError) return { error: invError };

    // Add user to room members
    const { error: memberError } = await addRoomMember(invitation.room_id, user.id);
    if (memberError) return { error: memberError };

    // Update invitation status
    const { error: updateError } = await supabase
        .from('room_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

    return { error: updateError };
}

/**
 * Decline a room invitation
 */
export async function declineInvitation(invitationId) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { error } = await supabase
        .from('room_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

    return { error };
}

/**
 * Subscribe to new invitations (real-time)
 */
export function subscribeToInvitations(callback) {
    if (!supabase) return () => { };

    const channel = supabase
        .channel('invitations')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'room_invitations'
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
