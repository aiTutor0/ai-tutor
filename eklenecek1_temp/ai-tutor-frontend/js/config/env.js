// js/config/env.js
// Supabase Configuration
// Get your Supabase URL and anon key from: https://app.supabase.com/project/_/settings/api
export const SUPABASE_URL = "https://haowbfhlmhgwjgpgbtyn.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";

// OpenAI proxy endpoint (Netlify Function)
// This keeps your OpenAI API key secure on the server
export const OPENAI_PROXY_URL = "/.netlify/functions/openai";

// Default OpenAI model (can be overridden in Netlify environment variables)
export const OPENAI_MODEL = "gpt-4o-mini";