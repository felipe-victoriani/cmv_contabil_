/**
 * kanban.js — Página Kanban de Tarefas
 */
import {
  watchTarefas,
  criarTarefa,
  atualizarTarefa,
  excluirTarefa,
  avancarStatus,
} from "../../services/tarefas.service.js";
import { watchClientes } from "../../services/clientes.service.js";
import { watchUsuarios } from "../../services/usuarios.service.js";
import { setState, getState } from "../../store/app.store.js";
import { showToast } from "../../components/toast/toast.js";
import { openModal, openConfirmModal } from "../../components/modal/modal.js";
import { injectCSS, removeCSS } from "../../utils/css.utils.js";
import { formatDate, diasRestantes } from "../../utils/date.utils.js";
import { required } from "../../utils/validators.js";

const CSS_ID = "css-kanban";

const COLUNAS = [
  { id: "todo", label: "A Fazer", icon: "circle" },
  { id: "doing", label: "Em Andamento", icon: "spinner-gap" },
  { id: "waiting", label: "Aguardando Cliente", icon: "clock" },
  { id: "done", label: "Concluído", icon: "check-circle" },
];

/** @type {function|null} */
let unsubTarefas = null;
/** @type {function|null} */
let unsubClientes = null;
/** @type {function|null} */
let unsubUsuarios = null;
/** @type {string} */
let filtroCliente = "";
/** @type {string} */
let filtroResponsavel = "";
/** @type {string|null} Tarefa sendo arrastada */
let draggingId = null;

/**
 * Monta a página Kanban.
 * @param {HTMLElement} container
 */
export async function mount(container) {
  await injectCSS("pages/kanban/kanban.css", CSS_ID);
  container.innerHTML = templateShell();
  bindPageEvents(container);

  unsubClientes = watchClientes((data) => {
    setState("clientes", data);
    renderFiltroClientes(container);
    renderBoard(container);
  });

  unsubTarefas = watchTarefas((data) => {
    setState("tarefas", data);
    renderBoard(container);
  });

  unsubUsuarios = watchUsuarios((data) => {
    setState("usuarios", data);
    renderFiltroResponsaveis(container);
    renderBoard(container);
  });
}

/** Remove a página Kanban. */
export function unmount() {
  unsubTarefas?.();
  unsubClientes?.();
  unsubUsuarios?.();
  unsubTarefas = unsubClientes = unsubUsuarios = null;
  filtroCliente = "";
  filtroResponsavel = "";
}

/** @returns {string} HTML do shell */
function templateShell() {
  return `
    <section class="kanban" aria-label="Kanban de Tarefas">
      <header class="kanban__header">
        <h1 class="kanban__title">Tarefas</h1>
        <div class="kanban__controls">
          <select class="input kanban__filtro" id="kanban-filtro-cliente" aria-label="Filtrar por cliente">
            <option value="">Todos os clientes</option>
          </select>
          <select class="input kanban__filtro" id="kanban-filtro-responsavel" aria-label="Filtrar por responsável">
            <option value="">Todos os responsáveis</option>
          </select>
          <button class="btn btn--primary" id="btn-nova-tarefa" aria-label="Criar nova tarefa">
            <i class="ph ph-plus" aria-hidden="true"></i>
            <span>Nova Tarefa</span>
          </button>
        </div>
      </header>

      <div class="kanban__board" id="kanban-board">
        ${COLUNAS.map(
          (col) => `
          <div class="kanban__col" data-status="${col.id}" id="col-${col.id}"
               role="region" aria-label="Coluna ${col.label}"
               aria-dropeffect="move">
            <div class="kanban__col-header">
              <div class="kanban__col-title">
                <i class="ph ph-${col.icon}" aria-hidden="true"></i>
                <span>${col.label}</span>
              </div>
              <span class="kanban__col-count" id="count-${col.id}">0</span>
            </div>
            <div class="kanban__col-cards" id="cards-${col.id}">
              <div class="kanban__skeleton">
                ${Array(2).fill('<div class="skeleton" style="height:100px;border-radius:10px;margin-bottom:8px"></div>').join("")}
              </div>
            </div>
          </div>
        `,
        ).join("")}
      </div>
    </section>
  `;
}

/**
 * Atualiza o select de filtro de clientes.
 * @param {HTMLElement} container
 */
function renderFiltroClientes(container) {
  const sel = container.querySelector("#kanban-filtro-cliente");
  if (!sel) return;
  const clientes = getState("clientes") || {};
  const current = sel.value;

  sel.innerHTML =
    `<option value="">Todos os clientes</option>` +
    Object.entries(clientes)
      .sort(([, a], [, b]) => (a.nome || "").localeCompare(b.nome || ""))
      .map(
        ([id, c]) =>
          `<option value="${id}" ${current === id ? "selected" : ""}>${c.nome}</option>`,
      )
      .join("");
}

/**
 * Atualiza o select de filtro de responsáveis.
 * @param {HTMLElement} container
 */
function renderFiltroResponsaveis(container) {
  const sel = container.querySelector("#kanban-filtro-responsavel");
  if (!sel) return;
  const usuarios = getState("usuarios") || {};
  const current = sel.value;

  sel.innerHTML =
    `<option value="">Todos os responsáveis</option>` +
    Object.entries(usuarios)
      .sort(([, a], [, b]) => (a.nome || "").localeCompare(b.nome || ""))
      .map(
        ([uid, u]) =>
          `<option value="${uid}" ${current === uid ? "selected" : ""}>${u.nome}</option>`,
      )
      .join("");
}

/**
 * Renderiza o board Kanban.
 * @param {HTMLElement} container
 */
function renderBoard(container) {
  const tarefas = getState("tarefas") || {};
  const clientes = getState("clientes") || {};
  const usuarios = getState("usuarios") || {};

  COLUNAS.forEach((col) => {
    const cardsEl = container.querySelector(`#cards-${col.id}`);
    const countEl = container.querySelector(`#count-${col.id}`);
    if (!cardsEl) return;

    // Remove skeleton
    cardsEl.querySelector(".kanban__skeleton")?.remove();

    const lista = Object.entries(tarefas)
      .filter(([, t]) => t.status === col.id)
      .filter(([, t]) => !filtroCliente || t.clienteId === filtroCliente)
      .filter(
        ([, t]) => !filtroResponsavel || t.responsavelId === filtroResponsavel,
      )
      .sort(([, a], [, b]) => (a.criadoEm || 0) - (b.criadoEm || 0));

    if (countEl) countEl.textContent = lista.length;

    if (!lista.length) {
      cardsEl.innerHTML = `
        <div class="kanban__empty" aria-label="Sem tarefas nesta coluna">
          <i class="ph ph-tray" aria-hidden="true"></i>
          <span>Sem tarefas</span>
        </div>
      `;
      bindDropZone(cardsEl, col.id);
      return;
    }

    cardsEl.innerHTML = lista
      .map(([id, t]) => {
        const cliente = clientes[t.clienteId];
        const diff = diasRestantes(t.vencimento);
        const atrasado = diff !== null && diff < 0 && col.id !== "done";
        const urgente =
          diff !== null && diff >= 0 && diff <= 3 && col.id !== "done";
        const proxCol = COLUNAS.find(
          (c, i) => i === COLUNAS.findIndex((x) => x.id === col.id) + 1,
        );
        const responsavel = t.responsavelId ? usuarios[t.responsavelId] : null;

        return `
        <div class="kanban__card ${atrasado ? "kanban__card--atrasado" : ""}"
             data-id="${id}"
             draggable="true"
             role="article"
             aria-label="Tarefa: ${t.titulo}${atrasado ? " — atrasada" : ""}">
          <div class="kanban__card-header">
            <p class="kanban__card-titulo">${t.titulo || "—"}</p>
            <div class="kanban__card-actions">
              ${
                proxCol
                  ? `
                <button class="btn btn--ghost btn--sm kanban__card-avancar"
                  data-id="${id}" data-status="${col.id}"
                  aria-label="Mover para ${proxCol.label}" title="Mover para ${proxCol.label}">
                  <i class="ph ph-arrow-right" aria-hidden="true"></i>
                </button>
              `
                  : ""
              }
              <button class="btn btn--ghost btn--sm kanban__card-edit"
                data-id="${id}" aria-label="Editar tarefa">
                <i class="ph ph-pencil-simple" aria-hidden="true"></i>
              </button>
              <button class="btn btn--ghost btn--sm kanban__card-delete"
                data-id="${id}" aria-label="Excluir tarefa">
                <i class="ph ph-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          ${
            cliente
              ? `
            <span class="kanban__card-cliente">
              <i class="ph ph-building-office" aria-hidden="true"></i>
              ${cliente.nome}
            </span>
          `
              : ""
          }

          ${
            t.vencimento
              ? `
            <span class="kanban__card-vencimento ${atrasado ? "kanban__card-vencimento--danger" : urgente ? "kanban__card-vencimento--warning" : ""}">
              <i class="ph ph-calendar" aria-hidden="true"></i>
              ${formatDate(t.vencimento)}
              ${atrasado ? '<span class="badge badge--danger" style="margin-left:4px">Atrasado</span>' : ""}
              ${urgente ? `<span class="badge badge--warning" style="margin-left:4px">${diff === 0 ? "Hoje" : `${diff}d`}</span>` : ""}
            </span>
          `
              : ""
          }

          ${
            t.descricao
              ? `<p class="kanban__card-desc">${t.descricao}</p>
            <div class="kanban__card-expand-hint" aria-hidden="true">
              <i class="ph ph-caret-down"></i>
            </div>`
              : ""
          }

          ${
            responsavel
              ? `
            <span class="kanban__card-responsavel">
              <i class="ph ph-user" aria-hidden="true"></i>
              ${responsavel.nome}
            </span>
          `
              : ""
          }
        </div>
      `;
      })
      .join("");

    bindDropZone(cardsEl, col.id);
    bindCardEvents(cardsEl, container);
  });
}

/**
 * Vincula drag & drop a uma coluna.
 * @param {HTMLElement} el
 * @param {string} status
 */
function bindDropZone(el, status) {
  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.classList.add("kanban__col-cards--over");
  });

  el.addEventListener("dragleave", (e) => {
    if (!el.contains(e.relatedTarget)) {
      el.classList.remove("kanban__col-cards--over");
    }
  });

  el.addEventListener("drop", async (e) => {
    e.preventDefault();
    el.classList.remove("kanban__col-cards--over");
    if (draggingId) {
      try {
        await atualizarTarefa(draggingId, { status, atualizadoEm: Date.now() });
      } catch {
        showToast("Erro ao mover tarefa.", "error");
      }
      draggingId = null;
    }
  });
}

/**
 * Vincula eventos dos cards.
 * @param {HTMLElement} el
 * @param {HTMLElement} container
 */
function bindCardEvents(el, container) {
  // Drag
  el.querySelectorAll(".kanban__card").forEach((card) => {
    card.addEventListener("dragstart", () => {
      draggingId = card.dataset.id;
      card.classList.add("kanban__card--dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("kanban__card--dragging");
    });

    // Expandir/recolher ao clicar no corpo do card
    card.addEventListener("click", (e) => {
      if (e.target.closest(".kanban__card-actions")) return;
      card.classList.toggle("kanban__card--expanded");
    });
  });

  // Avançar
  el.querySelectorAll(".kanban__card-avancar").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await avancarStatus(btn.dataset.id, btn.dataset.status);
      } catch {
        showToast("Erro ao mover tarefa.", "error");
      }
    });
  });

  // Editar
  el.querySelectorAll(".kanban__card-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const tarefas = getState("tarefas") || {};
      openTarefaModal({ id, tarefa: tarefas[id] });
    });
  });

  // Excluir
  el.querySelectorAll(".kanban__card-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const tarefas = getState("tarefas") || {};
      const t = tarefas[id];
      openConfirmModal({
        title: "Excluir tarefa",
        message: `Excluir a tarefa <strong>${t?.titulo}</strong>?`,
        confirmLabel: "Excluir",
        onConfirm: async () => {
          try {
            await excluirTarefa(id);
            showToast("Tarefa excluída.", "success");
          } catch {
            showToast("Erro ao excluir tarefa.", "error");
          }
        },
      });
    });
  });
}

/**
 * Abre o modal de criação/edição de tarefa.
 * @param {Object} [opts]
 */
function openTarefaModal({ id = null, tarefa = null } = {}) {
  const isEdit = !!id;
  const clientes = getState("clientes") || {};
  const usuarios = getState("usuarios") || {};

  const body = `
    <form id="form-tarefa" novalidate>
      <fieldset style="border:none;padding:0;display:contents">
        <legend class="sr-only">${isEdit ? "Editar Tarefa" : "Nova Tarefa"}</legend>
        <div class="form-grid">
          <div class="form-group form-grid--full">
            <label class="form-group__label" for="t-titulo">Título *</label>
            <input class="input" type="text" id="t-titulo" name="titulo"
              value="${tarefa?.titulo || ""}" required aria-required="true" aria-describedby="err-t-titulo"/>
            <span class="form-group__error" id="err-t-titulo" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="t-cliente">Cliente</label>
            <select class="input" id="t-cliente" name="clienteId">
              <option value="">Sem cliente</option>
              ${Object.entries(clientes)
                .sort(([, a], [, b]) =>
                  (a.nome || "").localeCompare(b.nome || ""),
                )
                .map(
                  ([cid, c]) =>
                    `<option value="${cid}" ${tarefa?.clienteId === cid ? "selected" : ""}>${c.nome}</option>`,
                )
                .join("")}
            </select>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="t-vencimento">Vencimento</label>
            <input class="input" type="date" id="t-vencimento" name="vencimento"
              value="${tarefa?.vencimento || ""}"/>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="t-status">Status</label>
            <select class="input" id="t-status" name="status">
              ${COLUNAS.map((c) => `<option value="${c.id}" ${(tarefa?.status || "todo") === c.id ? "selected" : ""}>${c.label}</option>`).join("")}
            </select>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="t-responsavel">Responsável</label>
            <select class="input" id="t-responsavel" name="responsavelId">
              <option value="">Sem responsável</option>
              ${Object.entries(usuarios)
                .sort(([, a], [, b]) =>
                  (a.nome || "").localeCompare(b.nome || ""),
                )
                .map(
                  ([uid, u]) =>
                    `<option value="${uid}" ${tarefa?.responsavelId === uid ? "selected" : ""}>${u.nome}</option>`,
                )
                .join("")}
            </select>
          </div>

          <div class="form-group form-grid--full">
            <label class="form-group__label" for="t-desc">Descrição</label>
            <textarea class="input" id="t-desc" name="descricao" rows="3">${tarefa?.descricao || ""}</textarea>
          </div>
        </div>
      </fieldset>
    </form>
  `;

  openModal({
    title: isEdit ? "Editar Tarefa" : "Nova Tarefa",
    body,
    size: "md",
    actions: [
      {
        label: "Cancelar",
        cls: "btn--secondary",
        action: ({ close }) => close(),
      },
      {
        label: isEdit ? "Salvar" : "Criar",
        cls: "btn--primary",
        action: ({ close }) => submitTarefa(close, id),
      },
    ],
  });
}

/**
 * Submete o formulário de tarefa.
 * @param {function} close
 * @param {string|null} id
 */
async function submitTarefa(close, id) {
  const form = document.getElementById("form-tarefa");
  if (!form) return;

  const dados = {
    titulo: form.elements["titulo"].value.trim(),
    clienteId: form.elements["clienteId"].value,
    vencimento: form.elements["vencimento"].value,
    status: form.elements["status"].value,
    descricao: form.elements["descricao"].value.trim(),
    responsavelId: form.elements["responsavelId"].value,
  };

  if (!required(dados.titulo)) {
    const group = form.elements["titulo"].closest(".form-group");
    const err = document.getElementById("err-t-titulo");
    group?.classList.add("form-group--invalid");
    if (err) err.textContent = "Título é obrigatório.";
    return;
  }

  try {
    if (id) {
      if (dados.status === "done") dados.atualizadoEm = Date.now();
      await atualizarTarefa(id, dados);
      showToast("Tarefa atualizada.", "success");
    } else {
      if (dados.status === "done") dados.atualizadoEm = Date.now();
      await criarTarefa(dados);
      showToast("Tarefa criada.", "success");
    }
    close();
  } catch {
    showToast("Erro ao salvar tarefa.", "error");
  }
}

/**
 * Vincula eventos da página.
 * @param {HTMLElement} container
 */
function bindPageEvents(container) {
  container.querySelector("#btn-nova-tarefa").addEventListener("click", () => {
    openTarefaModal();
  });

  container
    .querySelector("#kanban-filtro-cliente")
    .addEventListener("change", (e) => {
      filtroCliente = e.target.value;
      renderBoard(container);
    });

  container
    .querySelector("#kanban-filtro-responsavel")
    .addEventListener("change", (e) => {
      filtroResponsavel = e.target.value;
      renderBoard(container);
    });
}
