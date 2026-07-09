// =====================================
// FINANCE MANAGER
// SCRIPT PRINCIPAL
// =====================================


// ===============================
// ELEMENTOS GERAIS
// ===============================

const sidebar = document.querySelector(".sidebar");
const toggleMenu = document.querySelector(".toggle-menu");

const addButton = document.querySelector(".add");

const balanceValue = document.querySelector(".balance h2");
const incomeValue = document.querySelector(".income h2");
const expenseValue = document.querySelector(".expense h2");

const categoryList = document.getElementById("categoryList");

// Navegação
const navLinks = document.querySelectorAll("nav a[data-page]");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const goToLancamentos = document.getElementById("goToLancamentos");

// Dashboard
const dashboardBody = document.getElementById("dashboardBody");
const emptyDashboard = document.getElementById("emptyDashboard");
const DASHBOARD_LIMIT = 5;

// Lançamentos
const lancamentosBody = document.getElementById("lancamentosBody");
const emptyLancamentos = document.getElementById("emptyLancamentos");
const filterType = document.getElementById("filterType");
const filterCategory = document.getElementById("filterCategory");
const filterStart = document.getElementById("filterStart");
const filterEnd = document.getElementById("filterEnd");
const clearFilters = document.getElementById("clearFilters");

// Cartões
const cartoesBody = document.getElementById("cartoesBody");
const emptyCartoes = document.getElementById("emptyCartoes");
const cardTotals = document.getElementById("cardTotals");
const filterCard = document.getElementById("filterCard");

// Datalists do formulário
const categoryOptions = document.getElementById("categoryOptions");
const cardOptions = document.getElementById("cardOptions");

// Modal de formulário
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalClose = document.getElementById("modalClose");
const cancelBtn = document.getElementById("cancelBtn");
const transactionForm = document.getElementById("transactionForm");
const formError = document.getElementById("formError");

const transactionIdInput = document.getElementById("transactionId");
const descriptionInput = document.getElementById("description");
const valueInput = document.getElementById("value");
const dateInput = document.getElementById("date");
const categoryInput = document.getElementById("category");
const cardInput = document.getElementById("card");

const typeButtons = document.querySelectorAll(".type-btn");
let selectedType = "income";

// Modal de confirmação de exclusão
const confirmOverlay = document.getElementById("confirmOverlay");
const confirmCancel = document.getElementById("confirmCancel");
const confirmDelete = document.getElementById("confirmDelete");
let idPendingDelete = null;


// ===============================
// TÍTULOS DE CADA PÁGINA
// ===============================

const PAGE_INFO = {
    dashboard: {
        title: "Olá, Fabio ",
        subtitle: "Veja como está sua vida financeira hoje."
    },
    lancamentos: {
        title: "Lançamentos",
        subtitle: "Todas as suas receitas e despesas em um só lugar."
    },
    cartoes: {
        title: "Cartões",
        subtitle: "Acompanhe separadamente o quanto você gasta em cada cartão."
    }
};


// ===============================
// MENU LATERAL (recolher/expandir)
// ===============================

toggleMenu.addEventListener("click", () => {
    sidebar.classList.toggle("closed");
});


// ===============================
// NAVEGAÇÃO ENTRE PÁGINAS
// ===============================

function goToPage(pageName) {

    navLinks.forEach(link => {
        link.classList.toggle("active", link.dataset.page === pageName);
    });

    pages.forEach(page => {
        page.classList.toggle("active", page.id === `page-${pageName}`);
    });

    let info = PAGE_INFO[pageName];
    if (info) {
        pageTitle.textContent = info.title;
        pageSubtitle.textContent = info.subtitle;
    }

    if (pageName === "lancamentos") renderLancamentos();
    if (pageName === "cartoes") renderCartoes();
}

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        if (link.classList.contains("disabled")) return;
        goToPage(link.dataset.page);
    });
});

goToLancamentos.addEventListener("click", () => goToPage("lancamentos"));


// ===============================
// DADOS FINANCEIROS (SUPABASE)
// ===============================

let transactions = [];


// Converte o registro do banco (snake_case, tipos do Postgres)
// para o formato que o resto do script já usa
function mapFromSupabase(row) {
    return {
        id: row.id,
        description: row.description,
        value: Number(row.value),
        type: row.type,
        category: row.category,
        card: row.card || "",
        date: row.date,             // já vem como "yyyy-mm-dd"
        createdAt: row.created_at
    };
}


async function loadTransactions() {

    const { data, error } = await supabaseClient
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Erro ao carregar lançamentos:", error);
        alert("Não foi possível carregar seus lançamentos. Tente recarregar a página.");
        return;
    }

    transactions = data.map(mapFromSupabase);
}


async function insertTransaction(payload) {

    const { error } = await supabaseClient
        .from("transactions")
        .insert(payload);

    if (error) {
        formError.textContent = "Erro ao salvar: " + error.message;
        return false;
    }

    return true;
}


async function updateTransactionRemote(id, payload) {

    const { error } = await supabaseClient
        .from("transactions")
        .update(payload)
        .eq("id", id);

    if (error) {
        formError.textContent = "Erro ao salvar: " + error.message;
        return false;
    }

    return true;
}


async function deleteTransactionRemote(id) {

    const { error } = await supabaseClient
        .from("transactions")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Erro ao excluir: " + error.message);
        return false;
    }

    return true;
}


// ===============================
// FORMATAÇÃO
// ===============================

function formatMoney(value) {
    return value.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


// "2026-07-08" -> "08/07/2026" (usado só para exibir na tabela)
function formatDateBR(isoDate) {
    let [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
}


function escapeHtml(text) {
    let div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


// ===============================
// CALCULAR TOTAIS (DASHBOARD)
// ===============================

function calculateFinance() {

    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {
        if (transaction.type === "income") {
            income += transaction.value;
        } else {
            expense += transaction.value;
        }
    });

    let balance = income - expense;

    animateValue(balanceValue, balance);
    animateValue(incomeValue, income);
    animateValue(expenseValue, expense);
}


function animateValue(element, value) {

    let start = 0;
    let duration = 800;
    let increment = value / (duration / 16);

    if (increment === 0) {
        element.textContent = formatMoney(0);
        return;
    }

    let counter = setInterval(() => {

        start += increment;

        let done = increment > 0
            ? start >= value
            : start <= value;

        if (done) {
            start = value;
            clearInterval(counter);
        }

        element.textContent = formatMoney(start);

    }, 16);
}


// ===============================
// CATEGORIAS (DASHBOARD - TODOS OS GASTOS)
// ===============================

function renderCategories() {

    let totalsByCategory = {};

    transactions
        .filter(t => t.type === "expense")
        .forEach(t => {
            let key = t.category || "Outros";
            totalsByCategory[key] = (totalsByCategory[key] || 0) + t.value;
        });

    renderBarList(categoryList, totalsByCategory, "Nenhum gasto cadastrado ainda.");
}


// ===============================
// TOTAL POR CARTÃO (PÁGINA CARTÕES)
// ===============================

function renderCardTotals() {

    let totalsByCard = {};

    transactions
        .filter(t => t.type === "expense" && t.card)
        .forEach(t => {
            totalsByCard[t.card] = (totalsByCard[t.card] || 0) + t.value;
        });

    renderBarList(
        cardTotals,
        totalsByCard,
        'Nenhum gasto no cartão cadastrado ainda. Ao criar uma despesa, preencha o campo "Cartão".'
    );
}


// Função genérica: recebe um objeto { nome: total } e desenha as barrinhas
function renderBarList(container, totalsObject, emptyMessage) {

    let entries = Object.entries(totalsObject)
        .sort((a, b) => b[1] - a[1]);

    container.innerHTML = "";

    if (entries.length === 0) {
        container.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
        return;
    }

    let maxValue = entries[0][1];

    entries.forEach(([label, total]) => {

        let percent = (total / maxValue) * 100;

        let item = document.createElement("div");
        item.className = "category";

        item.innerHTML = `
            <div class="category-top">
                <span>${escapeHtml(label)}</span>
                <strong>${formatMoney(total)}</strong>
            </div>
            <div class="category-bar">
                <div class="category-bar-fill" style="width:${percent}%"></div>
            </div>
        `;

        container.appendChild(item);
    });
}


// ===============================
// MONTAR LINHA DA TABELA (reutilizado em todas as páginas)
// ===============================

function buildRow(transaction, showCardColumn) {

    let row = document.createElement("tr");

    let cardCell = showCardColumn
        ? `<td>${transaction.card ? escapeHtml(transaction.card) : "-"}</td>`
        : "";

    row.innerHTML = `
        <td>${escapeHtml(transaction.description)}</td>
        <td>${escapeHtml(transaction.category || "Outros")}</td>
        ${cardCell}
        <td>${formatDateBR(transaction.date)}</td>
        <td class="${transaction.type}">
            ${transaction.type === "income" ? "+" : "-"}
            ${formatMoney(transaction.value)}
        </td>
        <td class="actions">
            <button class="action-btn edit-btn" data-id="${transaction.id}" title="Editar">
                <i data-lucide="pencil"></i>
            </button>
            <button class="action-btn delete-btn" data-id="${transaction.id}" title="Excluir">
                <i data-lucide="trash-2"></i>
            </button>
        </td>
    `;

    return row;
}


function sortedByDateDesc(list) {
    return list.slice().sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1;
    });
}


// ===============================
// PÁGINA: DASHBOARD
// ===============================

function renderDashboard() {

    dashboardBody.innerHTML = "";

    let recent = sortedByDateDesc(transactions).slice(0, DASHBOARD_LIMIT);

    emptyDashboard.style.display = recent.length === 0 ? "block" : "none";

    recent.forEach(transaction => {
        dashboardBody.appendChild(buildRow(transaction, false));
    });

    lucide.createIcons();

    calculateFinance();
    renderCategories();
}


// ===============================
// PÁGINA: LANÇAMENTOS (COM FILTROS)
// ===============================

function populateCategoryFilter() {

    let categories = [...new Set(
        transactions.map(t => t.category || "Outros")
    )].sort();

    let currentValue = filterCategory.value;

    filterCategory.innerHTML = `<option value="all">Todas</option>`;

    categories.forEach(category => {
        let option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        filterCategory.appendChild(option);
    });

    // Mantém a seleção anterior se ainda existir na lista
    if ([...filterCategory.options].some(o => o.value === currentValue)) {
        filterCategory.value = currentValue;
    }
}


function getFilteredLancamentos() {

    return transactions.filter(t => {

        if (filterType.value !== "all" && t.type !== filterType.value) {
            return false;
        }

        if (filterCategory.value !== "all" && (t.category || "Outros") !== filterCategory.value) {
            return false;
        }

        if (filterStart.value && t.date < filterStart.value) {
            return false;
        }

        if (filterEnd.value && t.date > filterEnd.value) {
            return false;
        }

        return true;
    });
}


function renderLancamentos() {

    populateCategoryFilter();

    lancamentosBody.innerHTML = "";

    let filtered = sortedByDateDesc(getFilteredLancamentos());

    emptyLancamentos.style.display = filtered.length === 0 ? "block" : "none";

    filtered.forEach(transaction => {
        lancamentosBody.appendChild(buildRow(transaction, true));
    });

    lucide.createIcons();
}


[filterType, filterCategory, filterStart, filterEnd].forEach(el => {
    el.addEventListener("change", renderLancamentos);
});

clearFilters.addEventListener("click", () => {
    filterType.value = "all";
    filterCategory.value = "all";
    filterStart.value = "";
    filterEnd.value = "";
    renderLancamentos();
});


// ===============================
// PÁGINA: CARTÕES (COM FILTRO DE CARTÃO)
// ===============================

function populateCardFilter() {

    let cards = [...new Set(
        transactions
            .filter(t => t.type === "expense" && t.card)
            .map(t => t.card)
    )].sort();

    let currentValue = filterCard.value;

    filterCard.innerHTML = `<option value="all">Todos os cartões</option>`;

    cards.forEach(card => {
        let option = document.createElement("option");
        option.value = card;
        option.textContent = card;
        filterCard.appendChild(option);
    });

    if ([...filterCard.options].some(o => o.value === currentValue)) {
        filterCard.value = currentValue;
    }
}


function getFilteredCartoes() {

    return transactions.filter(t => {

        if (t.type !== "expense" || !t.card) return false;

        if (filterCard.value !== "all" && t.card !== filterCard.value) {
            return false;
        }

        return true;
    });
}


function renderCartoes() {

    populateCardFilter();
    renderCardTotals();

    cartoesBody.innerHTML = "";

    let filtered = sortedByDateDesc(getFilteredCartoes());

    emptyCartoes.style.display = filtered.length === 0 ? "block" : "none";

    filtered.forEach(transaction => {
        cartoesBody.appendChild(buildRow(transaction, true));
    });

    lucide.createIcons();
}


filterCard.addEventListener("change", renderCartoes);


// ===============================
// DATALISTS DO FORMULÁRIO (autocomplete)
// ===============================

function populateFormDatalists() {

    let categories = [...new Set(transactions.map(t => t.category || "Outros"))];
    let cards = [...new Set(transactions.filter(t => t.card).map(t => t.card))];

    categoryOptions.innerHTML = categories
        .map(c => `<option value="${escapeHtml(c)}"></option>`)
        .join("");

    cardOptions.innerHTML = cards
        .map(c => `<option value="${escapeHtml(c)}"></option>`)
        .join("");
}


// ===============================
// RENDERIZAR TUDO (após criar/editar/excluir)
// ===============================

function renderAll() {
    renderDashboard();
    populateFormDatalists();

    // Só recalcula as páginas de lançamentos/cartões se estiverem visíveis,
    // mas como é leve, atualizamos os filtros disponíveis sempre que necessário
    // (o conteúdo em si é recalculado ao entrar na página).
    if (document.getElementById("page-lancamentos").classList.contains("active")) {
        renderLancamentos();
    }
    if (document.getElementById("page-cartoes").classList.contains("active")) {
        renderCartoes();
    }
}


// ===============================
// MODAL - ABRIR / FECHAR
// ===============================

function openModal(transaction) {

    formError.textContent = "";
    transactionForm.reset();

    if (transaction) {
        modalTitle.textContent = "Editar movimentação";
        transactionIdInput.value = transaction.id;
        descriptionInput.value = transaction.description;
        valueInput.value = transaction.value;
        categoryInput.value = transaction.category || "";
        cardInput.value = transaction.card || "";
        dateInput.value = transaction.date;

        setSelectedType(transaction.type);

    } else {
        modalTitle.textContent = "Nova movimentação";
        transactionIdInput.value = "";

        let today = new Date();
        dateInput.value = today.toISOString().split("T")[0];

        setSelectedType("income");
    }

    modalOverlay.classList.add("open");
    descriptionInput.focus();
}


function closeModal() {
    modalOverlay.classList.remove("open");
}


function setSelectedType(type) {
    selectedType = type;
    typeButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.type === type);
    });
}


typeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        setSelectedType(btn.dataset.type);
    });
});


addButton.addEventListener("click", () => openModal(null));
modalClose.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeModal();
        closeConfirm();
    }
});


// ===============================
// SALVAR (CRIAR OU EDITAR)
// ===============================

const submitBtn = document.getElementById("submitBtn");

transactionForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    let description = descriptionInput.value.trim();
    let value = Number(valueInput.value);
    let date = dateInput.value; // já vem em "yyyy-mm-dd"
    let category = categoryInput.value.trim() || "Outros";
    let card = cardInput.value.trim() || null;
    let id = transactionIdInput.value;

    if (!description) {
        formError.textContent = "Informe uma descrição.";
        return;
    }

    if (!value || value <= 0) {
        formError.textContent = "Informe um valor válido, maior que zero.";
        return;
    }

    if (!date) {
        formError.textContent = "Informe uma data.";
        return;
    }

    formError.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Salvando...";

    let payload = { description, value, type: selectedType, category, card, date };

    let ok = id
        ? await updateTransactionRemote(id, payload)
        : await insertTransaction(payload);

    submitBtn.disabled = false;
    submitBtn.textContent = "Salvar";

    if (!ok) return;

    await loadTransactions();
    renderAll();
    closeModal();
});


// ===============================
// EDITAR / EXCLUIR (delegação de evento global)
// ===============================

document.addEventListener("click", (e) => {

    let editBtn = e.target.closest(".edit-btn");
    let deleteBtn = e.target.closest(".delete-btn");

    if (editBtn) {
        let id = editBtn.dataset.id;
        let transaction = transactions.find(t => t.id === id);
        if (transaction) openModal(transaction);
    }

    if (deleteBtn) {
        idPendingDelete = deleteBtn.dataset.id;
        confirmOverlay.classList.add("open");
    }
});


function closeConfirm() {
    confirmOverlay.classList.remove("open");
    idPendingDelete = null;
}


confirmCancel.addEventListener("click", closeConfirm);

confirmOverlay.addEventListener("click", (e) => {
    if (e.target === confirmOverlay) closeConfirm();
});

confirmDelete.addEventListener("click", async () => {

    if (idPendingDelete !== null) {

        confirmDelete.disabled = true;
        confirmDelete.textContent = "Excluindo...";

        let ok = await deleteTransactionRemote(idPendingDelete);

        confirmDelete.disabled = false;
        confirmDelete.textContent = "Excluir";

        if (ok) {
            await loadTransactions();
            renderAll();
        }
    }

    closeConfirm();
});


// ===============================
// USUÁRIO / LOGOUT
// ===============================

const userEmailEl = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

async function setupUserInfo() {

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) return;

    let name = user.user_metadata?.full_name || user.email.split("@")[0];
    PAGE_INFO.dashboard.title = `Olá, ${name} `;

    if (userEmailEl) userEmailEl.textContent = user.email;

    // Se a página inicial (dashboard) já está visível, atualiza o texto agora
    if (pageTitle && document.getElementById("page-dashboard").classList.contains("active")) {
        pageTitle.textContent = PAGE_INFO.dashboard.title;
    }
}

logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
});


// ===============================
// INICIAR SISTEMA
// ===============================

(async function init() {
    await setupUserInfo();
    await loadTransactions();
    renderDashboard();
    populateFormDatalists();
})();
