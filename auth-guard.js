// =========================================================
// AUTH GUARD
// Roda antes do script.js. Se não houver sessão ativa,
// manda o usuário direto para a tela de login.
// =========================================================

(async () => {

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Erro ao verificar sessão:", error);
    }

    if (!data.session) {
        window.location.href = "login.html";
    }

})();
