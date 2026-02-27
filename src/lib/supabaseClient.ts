import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;


if (!supabaseUrl || !supabaseAnonKey) {

  throw new Error("Missing Supabase env vars. Check .env file.");

}


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {

  auth: {

    persistSession: true,     // “se souvenir de moi”

    autoRefreshToken: true,   // refresh automatique

    detectSessionInUrl: true, // utile pour magic link si tu l’actives plus tard

  },

});