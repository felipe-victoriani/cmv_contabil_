/**
 * home.js — Dashboard Home do ContaFlow
 */
import { injectCSS } from "../../utils/css.utils.js";
import { getState, subscribe } from "../../store/app.store.js";
import { formatDate, diasRestantes } from "../../utils/date.utils.js";
import { getFraseAleatoria } from "../../utils/frases.utils.js";
import { sanitize } from "../../utils/sanitize.utils.js";
import { showToast } from "../../components/toast/toast.js";

const CSS_ID = "css-home";
const ALERT_DAYS = 3;

/** @type {Array<function>} Unsubscribers dos listeners do store */
const unsubs = [];

const SESSION_KEY_NOTIF = "cf_notif_atrasadas_";

/**
 * Monta a página Home.
 * @param {HTMLElement} container
 */
export async function mount(container) {
  await injectCSS("pages/home/home.css", CSS_ID);
  container.innerHTML = template();
  setDate();
  setGreeting();
  setFrase();
  bindStoreListeners();
}

/** Remove a página Home. */
export function unmount() {
  unsubs.forEach((fn) => fn());
  unsubs.length = 0;
}

// ── Template HTML ──────────────────────────────────────

function template() {
  return `
    <section class="home" aria-label="Dashboard">

      <header class="home__header">
        <div class="home__greeting">
          <h1 class="home__title" id="home-title">Olá! ☀️</h1>
          <p class="home__date" id="home-date"></p>
          <p class="home__frase" id="home-frase" aria-label="Frase do dia"></p>
        </div>
      </header>

      <!-- KPI Cards -->
      <div class="home__kpis" role="list" aria-label="Indicadores">

        <div class="kpi-card kpi-card--danger" role="listitem">
          <span class="kpi-card__number home-skeleton" id="kpi-prazos-num">—</span>
          <span class="kpi-card__label">Prazos vencendo</span>
          <span class="kpi-card__sub">próximos ${ALERT_DAYS} dias</span>
        </div>

        <div class="kpi-card kpi-card--warning" role="listitem">
          <span class="kpi-card__number home-skeleton" id="kpi-tarefas-num">—</span>
          <span class="kpi-card__label">Tarefas em aberto</span>
          <span class="kpi-card__sub">excluindo concluídas</span>
        </div>

        <div class="kpi-card kpi-card--info" role="listitem">
          <span class="kpi-card__number home-skeleton" id="kpi-docs-num">—</span>
          <span class="kpi-card__label">Docs pendentes</span>
          <span class="kpi-card__sub">aguardando recebimento</span>
        </div>

        <div class="kpi-card kpi-card--success" role="listitem">
          <span class="kpi-card__number home-skeleton" id="kpi-concluidas-num">—</span>
          <span class="kpi-card__label">Concluídas hoje</span>
          <span class="kpi-card__sub">tarefas e prazos</span>
        </div>

      </div>

      <!-- Body -->
      <div class="home__body">

        <!-- Main -->
        <div class="home__main">

          <!-- Alertas de Prazo -->
          <div class="home-section" aria-label="Alertas de prazo">
            <div class="home-section__header">
              <h2 class="home-section__title">
                <i class="ph ph-warning-circle" aria-hidden="true"></i>
                Alertas de Prazo
              </h2>
              <a href="#/prazos" class="home-section__link" aria-label="Ver todos os prazos">Ver todos →</a>
            </div>
            <div class="alertas-list" id="alertas-list" role="list">
              <div class="skeleton-row" aria-hidden="true"></div>
              <div class="skeleton-row" aria-hidden="true"></div>
              <div class="skeleton-row" aria-hidden="true"></div>
            </div>
          </div>

          <!-- Kanban Mini -->
          <div class="home-section" aria-label="Tarefas por status">
            <div class="home-section__header">
              <h2 class="home-section__title">
                <i class="ph ph-kanban" aria-hidden="true"></i>
                Tarefas por Status
              </h2>
              <a href="#/kanban" class="home-section__link" aria-label="Abrir Kanban">Abrir Kanban →</a>
            </div>
            <div class="kanban-mini" role="list">
              <div class="kanban-mini__col" role="listitem">
                <p class="kanban-mini__label">A Fazer</p>
                <span class="kanban-mini__count home-skeleton" id="km-todo-count">—</span>
              </div>
              <div class="kanban-mini__col" role="listitem">
                <p class="kanban-mini__label">Em Andamento</p>
                <span class="kanban-mini__count home-skeleton" id="km-doing-count">—</span>
              </div>
              <div class="kanban-mini__col" role="listitem">
                <p class="kanban-mini__label">Aguardando</p>
                <span class="kanban-mini__count home-skeleton" id="km-waiting-count">—</span>
              </div>
              <div class="kanban-mini__col kanban-mini__col--done" role="listitem">
                <p class="kanban-mini__label">Concluído</p>
                <span class="kanban-mini__count home-skeleton" id="km-done-count">—</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Sidebar -->
        <div class="home__sidebar">

          <!-- Docs Pendentes -->
          <div class="home-section" aria-label="Documentos pendentes">
            <div class="home-section__header">
              <h2 class="home-section__title">
                <i class="ph ph-folder-open" aria-hidden="true"></i>
                Docs Pendentes
              </h2>
              <a href="#/documentos" class="home-section__link" aria-label="Ver documentos">Ver →</a>
            </div>
            <ul class="docs-pendentes-list" id="docs-pendentes-list" aria-label="Clientes com documentos pendentes">
              <li class="skeleton-row" aria-hidden="true"></li>
              <li class="skeleton-row" aria-hidden="true"></li>
            </ul>
          </div>

          <!-- Atividade Recente -->
          <div class="home-section" aria-label="Atividade recente">
            <div class="home-section__header">
              <h2 class="home-section__title">
                <i class="ph ph-clock-clockwise" aria-hidden="true"></i>
                Atividade Recente
              </h2>
            </div>
            <ul class="atividade-list" id="atividade-list" aria-label="Últimas atividades">
              <li class="skeleton-row" aria-hidden="true"></li>
              <li class="skeleton-row" aria-hidden="true"></li>
              <li class="skeleton-row" aria-hidden="true"></li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  `;
}

// ── Setup ──────────────────────────────────────────────

/** Exibe a data atual formatada no header. */
function setDate() {
  const el = document.getElementById("home-date");
  if (!el) return;
  el.textContent = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

/** Exibe saudação com o nome do usuário logado. */
function setGreeting() {
  const el = document.getElementById("home-title");
  if (!el) return;
  const user = getState("user");
  const nome = user?.displayName || user?.email?.split("@")[0] || null;
  const hora = new Date().getHours();
  const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const emoji = hora < 12 ? "☀️" : hora < 18 ? "🌤️" : "🌙";
  el.textContent = nome
    ? `${periodo}, ${nome}! ${emoji}`
    : `${periodo}! ${emoji}`;
}

/** Exibe frase humorística sorteada aleatoriamente. */
function setFrase() {
  const el = document.getElementById("home-frase");
  if (!el) return;
  el.textContent = getFraseAleatoria();
}

/** Inscreve nos dados do store e dispara renderização inicial. */
function bindStoreListeners() {
  unsubs.push(
    subscribe("prazos", () => {
      renderAlertas();
      renderKPIs();
    }),
    subscribe("tarefas", () => {
      renderKanbanMini();
      renderKPIs();
      notificarTarefasAtrasadas();
    }),
    subscribe("documentos", () => {
      renderDocsPendentes();
      renderKPIs();
    }),
    subscribe("clientes", () => {
      renderDocsPendentes();
      renderAlertas();
    }),
  );

  // Renderização inicial com dados já no store
  renderKPIs();
  renderAlertas();
  renderKanbanMini();
  renderDocsPendentes();
  renderAtividade();
}

// ── Utilitários ───────────────────────────────────────

/**
 * Converte um timestamp (ms) para string de data local "YYYY-MM-DD".
 * @param {number|null|undefined} ts
 * @returns {string|null}
 */
function toLocalDate(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Renderizadores ─────────────────────────────────────

/** KPI Cards — 4 números no topo. */
function renderKPIs() {
  const tarefas = getState("tarefas") || {};
  const prazos = getState("prazos") || {};
  const documentos = getState("documentos") || {};
  const _hoje = new Date();
  const hoje = `${_hoje.getFullYear()}-${String(_hoje.getMonth() + 1).padStart(2, "0")}-${String(_hoje.getDate()).padStart(2, "0")}`;

  const prazosUrgentes = Object.values(prazos).filter((p) => {
    if (p.done) return false;
    const dias = diasRestantes(p.vencimento);
    return dias !== null && dias >= 0 && dias <= ALERT_DAYS;
  }).length;

  const tarefasAbertas = Object.values(tarefas).filter(
    (t) => t.status !== "done",
  ).length;

  const docsPendentes = Object.values(documentos).filter(
    (d) => d.status === "pendente",
  ).length;

  const doneDate = (item) =>
    toLocalDate(item.atualizadoEm) ?? toLocalDate(item.criadoEm);

  const concluidasHoje = [
    ...Object.values(tarefas).filter(
      (t) => t.status === "done" && doneDate(t) === hoje,
    ),
    ...Object.values(prazos).filter((p) => p.done && doneDate(p) === hoje),
  ].length;

  setText("kpi-prazos-num", prazosUrgentes);
  setText("kpi-tarefas-num", tarefasAbertas);
  setText("kpi-docs-num", docsPendentes);
  setText("kpi-concluidas-num", concluidasHoje);

  [
    "kpi-prazos-num",
    "kpi-tarefas-num",
    "kpi-docs-num",
    "kpi-concluidas-num",
  ].forEach((id) =>
    document.getElementById(id)?.classList.remove("home-skeleton"),
  );
}

/** Lista de alertas de prazo (vencidos + próximos). */
function renderAlertas() {
  const list = document.getElementById("alertas-list");
  const prazos = getState("prazos") || {};
  const clientes = getState("clientes") || {};
  if (!list) return;

  // Vencidos (até 2 mais recentes)
  const vencidos = Object.entries(prazos)
    .map(([id, p]) => ({ id, ...p, dias: diasRestantes(p.vencimento) }))
    .filter((p) => !p.done && p.dias !== null && p.dias < 0)
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 2);

  // Urgentes (vence em até ALERT_DAYS dias)
  const urgentes = Object.entries(prazos)
    .map(([id, p]) => ({ id, ...p, dias: diasRestantes(p.vencimento) }))
    .filter(
      (p) => !p.done && p.dias !== null && p.dias >= 0 && p.dias <= ALERT_DAYS,
    )
    .sort((a, b) => a.dias - b.dias);

  const todos = [...vencidos, ...urgentes];

  if (!todos.length) {
    list.innerHTML = emptyState(
      "ph-check-circle",
      "Nenhum prazo urgente. Tudo em dia!",
    );
    return;
  }

  list.innerHTML = todos
    .map((p) => {
      const clienteNome =
        p.clienteId && clientes[p.clienteId]
          ? clientes[p.clienteId].nome
          : "Geral";
      const { label, mod } = urgencyLabel(p.dias);
      return `
        <div class="alerta-item" role="listitem">
          <span class="alerta-item__badge alerta-item__badge--${mod}">${label}</span>
          <span class="alerta-item__tipo">${sanitize(p.tipo || p.descricao || "—")}</span>
          <span class="alerta-item__cliente">${sanitize(clienteNome)}</span>
          <a href="#/prazos" class="alerta-item__link" aria-label="Ver prazo">
            <i class="ph ph-arrow-right" aria-hidden="true"></i>
          </a>
        </div>
      `;
    })
    .join("");
}

/** Mini Kanban com contadores por coluna. */
function renderKanbanMini() {
  const tarefas = getState("tarefas") || {};
  const cols = { todo: 0, doing: 0, waiting: 0, done: 0 };

  Object.values(tarefas).forEach((t) => {
    if (cols[t.status] !== undefined) cols[t.status]++;
  });

  Object.entries(cols).forEach(([status, count]) => {
    const el = document.getElementById(`km-${status}-count`);
    if (!el) return;
    el.textContent = count;
    el.classList.remove("home-skeleton");
  });
}

/** Clientes com documentos pendentes (agrupados). */
function renderDocsPendentes() {
  const list = document.getElementById("docs-pendentes-list");
  const documentos = getState("documentos") || {};
  const clientes = getState("clientes") || {};
  if (!list) return;

  const porCliente = {};
  Object.values(documentos)
    .filter((d) => d.status === "pendente" && d.clienteId)
    .forEach((d) => {
      porCliente[d.clienteId] = (porCliente[d.clienteId] || 0) + 1;
    });

  const entries = Object.entries(porCliente)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (!entries.length) {
    list.innerHTML = `<li>${emptyState("ph-folder-check", "Nenhum doc pendente.")}</li>`;
    return;
  }

  list.innerHTML = entries
    .map(([clienteId, count]) => {
      const nome = clientes[clienteId]?.nome || "Cliente";
      return `
        <li class="docs-pendentes-item">
          <span class="docs-pendentes-item__nome">${sanitize(nome)}</span>
          <span class="docs-pendentes-item__badge">${count} doc${count > 1 ? "s" : ""}</span>
        </li>
      `;
    })
    .join("");
}

/** Atividade recente — últimas 6 criações entre tarefas, prazos e documentos. */
function renderAtividade() {
  const list = document.getElementById("atividade-list");
  const tarefas = getState("tarefas") || {};
  const prazos = getState("prazos") || {};
  const documentos = getState("documentos") || {};
  if (!list) return;

  const eventos = [
    ...Object.values(tarefas).map((t) => ({
      texto: t.titulo || "Sem título",
      tipo: "Tarefa",
      icon: "ph-check-square",
      ts: t.criadoEm || 0,
    })),
    ...Object.values(prazos).map((p) => ({
      texto: p.tipo || p.descricao || "Prazo",
      tipo: "Prazo",
      icon: "ph-calendar-check",
      ts: p.criadoEm || 0,
    })),
    ...Object.values(documentos).map((d) => ({
      texto: d.nome || "Documento",
      tipo: "Documento",
      icon: "ph-file-text",
      ts: d.criadoEm || 0,
    })),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 6);

  if (!eventos.length) {
    list.innerHTML = `<li>${emptyState("ph-clock", "Nenhuma atividade ainda.")}</li>`;
    return;
  }

  list.innerHTML = eventos
    .map(
      (e) => `
      <li class="atividade-item">
        <i class="ph ${e.icon} atividade-item__icon" aria-hidden="true"></i>
        <div>
          <span class="atividade-item__texto">${sanitize(e.texto)}</span>
          <span class="atividade-item__meta">${e.tipo} · ${formatRelativeTime(e.ts)}</span>
        </div>
      </li>
    `,
    )
    .join("");
}

// ── Notificações ───────────────────────────────────────

/**
 * Exibe um toast de aviso uma única vez por montagem quando há tarefas
 * com vencimento passado e status diferente de "done".
 */
function notificarTarefasAtrasadas() {
  const uid = getState("user")?.uid || "anon";
  const key = SESSION_KEY_NOTIF + uid;
  if (sessionStorage.getItem(key)) return;
  const tarefas = getState("tarefas") || {};
  const atrasadas = Object.values(tarefas).filter((t) => {
    if (t.status === "done" || !t.vencimento) return false;
    return diasRestantes(t.vencimento) < 0;
  });
  if (!atrasadas.length) return;
  sessionStorage.setItem(key, "1");
  const qtd = atrasadas.length;
  showToast(
    `${qtd} tarefa${qtd > 1 ? "s" : ""} com prazo vencido — <a href="#/kanban" style="color:inherit;font-weight:600;text-decoration:underline">Ver no Kanban</a>`,
    "warning",
    7000,
  );
}

// ── Helpers ────────────────────────────────────────────

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function urgencyLabel(dias) {
  if (dias < 0) return { label: "Vencido", mod: "danger" };
  if (dias === 0) return { label: "Hoje", mod: "danger" };
  if (dias === 1) return { label: "Amanhã", mod: "warning" };
  return { label: `${dias} dias`, mod: "warning" };
}

function emptyState(icon, text) {
  return `
    <div class="home-empty">
      <i class="ph ${icon} home-empty__icon" aria-hidden="true"></i>
      <p class="home-empty__text">${text}</p>
    </div>
  `;
}

function formatRelativeTime(ts) {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  const dias = Math.floor(diff / 86400);
  return `${dias} dia${dias > 1 ? "s" : ""} atrás`;
}
