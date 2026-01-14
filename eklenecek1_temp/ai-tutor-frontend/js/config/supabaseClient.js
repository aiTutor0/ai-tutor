// js/config/supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env.js";

let supabase = null;

try {
  // use anon key (don't use service_role!)
  if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("SENIN_")) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase bağlandı.");
  } else {
    console.warn("⚠️ Supabase anon key girilmemiş (demo mode).");
  }
} catch (err) {
  console.error("❌ Supabase hatası:", err);
}

export { supabase };
