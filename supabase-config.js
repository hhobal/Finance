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

const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SEU_PROJETO";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_ANON_KEY_DO_SEU_PROJETO";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
