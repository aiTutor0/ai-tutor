// js/services/userService.js
import { supabase } from "../config/supabaseClient.js";

// ======================================
// USER MANAGEMENT
// ======================================

/**
 * Get current user profile
 */
export async function getCurrentUserProfile() {
    if (!supabase) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    return { data, error };
}

/**
 * Update current user profile
 */
export async function updateUserProfile(updates) {
    if (!supabase) return { error: { message: "Supabase bağlı değil (demo)" } };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

    return { error };
}

/**
 * Get all users (for admin/teacher)
 */
export async function getAllUsers() {
    if (!supabase) return { data: [], error: null };

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}

/**
 * Get users by role
 */
export async function getUsersByRole(role) {
    if (!supabase) return { data: [], error: null };

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}

/**
 * Search users by email or name
 */
export async function searchUsers(query) {
    if (!supabase) return { data: [], error: null };

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

    return { data: data || [], error };
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
    if (!supabase) return { data: null, error: null };

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    return { data, error };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
    if (!supabase) return false;

    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
}

/**
 * Get current user's role
 */
export async function getCurrentUserRole() {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    return data?.role || null;
}
