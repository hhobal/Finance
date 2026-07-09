// =========================================================
// LOGIN / CADASTRO
// =========================================================


// Se já existe sessão ativa, pula direto pro dashboard
(async () => {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
        window.location.href = "index.html";
    }
})();


// ===============================
// ALTERNAR ABAS (Entrar / Criar conta)
// ===============================

const authTabs = document.querySelectorAll(".auth-tab");
const authForms = document.querySelectorAll(".auth-form");

authTabs.forEach(tab => {
    tab.addEventListener("click", () => {

        authTabs.forEach(t => t.classList.toggle("active", t === tab));

        authForms.forEach(form => form.classList.remove("active"));

        let targetId = tab.dataset.tab === "login" ? "loginForm" : "signupForm";
        document.getElementById(targetId).classList.add("active");
    });
});


// ===============================
// TRADUZIR MENSAGENS DE ERRO
// ===============================

function traduzErro(mensagem) {

    if (mensagem.includes("Invalid login credentials")) {
        return "E-mail ou senha incorretos.";
    }

    if (mensagem.includes("User already registered")) {
        return "Esse e-mail já está cadastrado. Tente entrar.";
    }

    if (mensagem.includes("Password should be at least")) {
        return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (mensagem.includes("Unable to validate email")) {
        return "Informe um e-mail válido.";
    }

    return mensagem;
}


// ===============================
// LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginSubmit = document.getElementById("loginSubmit");

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();
    loginError.textContent = "";

    let email = document.getElementById("loginEmail").value.trim();
    let password = document.getElementById("loginPassword").value;

    loginSubmit.disabled = true;
    loginSubmit.textContent = "Entrando...";

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    loginSubmit.disabled = false;
    loginSubmit.textContent = "Entrar";

    if (error) {
        loginError.textContent = traduzErro(error.message);
        return;
    }

    window.location.href = "index.html";
});


// ===============================
// CADASTRO
// ===============================

const signupForm = document.getElementById("signupForm");
const signupError = document.getElementById("signupError");
const signupSuccess = document.getElementById("signupSuccess");
const signupSubmit = document.getElementById("signupSubmit");

signupForm.addEventListener("submit", async (e) => {

    e.preventDefault();
    signupError.textContent = "";
    signupSuccess.textContent = "";

    let name = document.getElementById("signupName").value.trim();
    let email = document.getElementById("signupEmail").value.trim();
    let password = document.getElementById("signupPassword").value;

    signupSubmit.disabled = true;
    signupSubmit.textContent = "Criando...";

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: name }
        }
    });

    signupSubmit.disabled = false;
    signupSubmit.textContent = "Criar conta";

    if (error) {
        signupError.textContent = traduzErro(error.message);
        return;
    }

    // Se a confirmação de e-mail estiver desativada no projeto,
    // o Supabase já devolve uma sessão ativa e podemos entrar direto.
    if (data.session) {
        window.location.href = "index.html";
        return;
    }

    signupSuccess.textContent = "Conta criada! Verifique seu e-mail para confirmar antes de entrar.";
    signupForm.reset();
});
