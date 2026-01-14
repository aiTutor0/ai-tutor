// js/services/authService.js
import { supabase } from "../config/supabaseClient.js";

export async function loginUser(email, password) {
  if (!supabase) return { data: null, error: { message: "Supabase bağlı değil (demo)" } };

  return await supabase.auth.signInWithPassword({ email, password });
}

export async function registerUser({ name, email, password, role }) {
  if (!supabase) return { data: null, error: { message: "Supabase bağlı değil (demo)" } };

  // Supabase Auth signUp
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, role }
    }
  });

  return result;
}

export async function loginWithGoogle() {
  if (!supabase) return { data: null, error: { message: "Supabase bağlı değil (demo)" } };

  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });
}

export async function logoutUser() {
  if (supabase) await supabase.auth.signOut();
  window.location.reload();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

export function onAuthChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
