// =========================================================
// CONFIGURAÇÃO DO SUPABASE
// =========================================================
// Onde encontrar esses valores:
// supabase.com → seu projeto → Settings → API
//
// SUPABASE_URL      -> campo "Project URL"
// SUPABASE_ANON_KEY -> campo "anon public" (em "Project API keys")
//
// A "anon key" é segura para expor no front-end: ela é pública
// por design. Quem protege os dados de cada usuário é a Row
// Level Security configurada no supabase-schema.sql.
//
// NUNCA coloque a "service_role key" aqui — essa sim é secreta
// e nunca deve aparecer em código que roda no navegador.
// =========================================================

const SUPABASE_URL = "https://eooigfcltzwpletkzaxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvb2lnZmNsdHp3cGxldGt6YXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTk1MTEsImV4cCI6MjA5OTE5NTUxMX0.6j7nD0cG_t3XGvZOCVYHq3aBV8kmswhZa7JhQXMiyXs";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
