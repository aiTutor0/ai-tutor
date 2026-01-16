// Supabase Configuration
// Get your Supabase URL and anon key from: https://app.supabase.com/project/_/settings/api
export const SUPABASE_URL = "https://haowbfhlmhgwjgpgbtyn.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3diZmhsbWhnd2pncGdidHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTk0MDgsImV4cCI6MjA4MTM3NTQwOH0.oc2LfHXXTRo8YPXrgpbxV6Ts6jvKNOFaaDR15ay9H0A";

// OpenAI proxy endpoint
// Automatically detects environment: local development uses /api/openai, Netlify uses /.netlify/functions/openai
const isNetlify = typeof window !== 'undefined' && window.location.hostname.includes('netlify');
export const OPENAI_PROXY_URL = isNetlify ? "/.netlify/functions/openai" : "/api/openai";

// Default OpenAI model (can be overridden in environment variables)
export const OPENAI_MODEL = "gpt-4o-mini";