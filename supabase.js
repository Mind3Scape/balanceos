/* BalanceOS — Supabase connection config (PUBLIC values only).

   The project URL and the anon/publishable key are SAFE to ship in the client —
   that's how Supabase is designed; the database's row-level security is what
   actually protects each user's data. SECRET keys (service_role, the Telegram
   bot token) live ONLY inside Supabase, never in this repo.

   Empty key = the app simply runs in local-only mode (everything still works,
   just no cloud yet). Paste the anon key on the line below to switch the live
   Telegram door over to real cloud sync. */
window.SUPABASE_URL = "https://vnkjsqvtgybqlfnhdijf.supabase.co";

// 👇 ВСТАВЬ СЮДА anon / public ключ из Supabase → Settings → API Keys (между кавычками)
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZua2pzcXZ0Z3licWxmbmhkaWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMDkyMTcsImV4cCI6MjA5Nzc4NTIxN30.kd2g44Gchb10Pw4OrDjx1mCsO9pjVK6Qaf1p22d47k4";
