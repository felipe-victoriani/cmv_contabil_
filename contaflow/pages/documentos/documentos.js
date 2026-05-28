/**
 * documentos.js — Página de Documentos
 */
import {
  watchDocumentos,
  criarDocumento,
  atualizarDocumento,
  excluirDocumento,
  avancarStatusDocumento,
} from "../../services/documentos.service.js";
import { watchClientes } from "../../services/clientes.service.js";
import { setState, getState } from "../../store/app.store.js";
import { showToast } from "../../components/toast/toast.js";
import { openModal, openConfirmModal } from "../../components/modal/modal.js";
import { injectCSS, removeCSS } from "../../utils/css.utils.js";
import { formatCompetencia } from "../../utils/date.utils.js";
import { required } from "../../utils/validators.js";

const CSS_ID = "css-documentos";

const STATUS_LABELS = {
  pendente: "Pendente",
  recebido: "Recebido",
  conferido: "Conferido",
};

const STATUS_BADGE = {
  pendente: "badge--warning",
  recebido: "badge--info",
  conferido: "badge--success",
};

const STATUS_NEXT = {
  pendente: "recebido",
  recebido: "conferido",
  conferido: null,
};

const STATUS_NEXT_LABEL = {
  pendente: "Marcar como Recebido",
  recebido: "Marcar como Conferido",
  conferido: null,
};

/** @type {function|null} */ let unsubDocs = null;
/** @type {function|null} */ let unsubClientes = null;
/** @type {string} */ let filtroCliente = "";
/** @type {string} */ let filtroStatus = "";
/** @type {string} */ let filtroBusca = "";

/**
 * Monta a página de documentos.
 * @param {HTMLElement} container
 */
export function mount(container) {
  injectCSS("pages/documentos/documentos.css", CSS_ID);
  container.innerHTML = templateShell();
  bindPageEvents(container);

  unsubClientes = watchClientes((data) => {
    setState("clientes", data);
    renderFiltroClientes(container);
    renderTabela(container);
  });

  unsubDocs = watchDocumentos((data) => {
    setState("documentos", data);
    renderTabela(container);
  });
}

/** Remove a página de documentos. */
export function unmount() {
  unsubDocs?.();
  unsubClientes?.();
  unsubDocs = unsubClientes = null;
  filtroCliente = filtroStatus = filtroBusca = "";
  removeCSS(CSS_ID);
}

/** @returns {string} HTML do shell */
function templateShell() {
  return `
    <section class="documentos" aria-label="Documentos">
      <header class="documentos__header">
        <h1 class="documentos__title">Documentos</h1>
        <button class="btn btn--primary" id="btn-novo-doc" aria-label="Registrar novo documento">
          <i class="ph ph-plus" aria-hidden="true"></i>
          <span>Novo Documento</span>
        </button>
      </header>

      <div class="documentos__filtros" role="search" aria-label="Filtros">
        <div class="documentos__busca">
          <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
          <input class="input" type="search" id="doc-busca"
            placeholder="Buscar por nome..." aria-label="Buscar documento" autocomplete="off"/>
        </div>
        <select class="input documentos__filtro-sel" id="doc-filtro-cliente" aria-label="Filtrar por cliente">
          <option value="">Todos os clientes</option>
        </select>
        <select class="input documentos__filtro-sel" id="doc-filtro-status" aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="recebido">Recebido</option>
          <option value="conferido">Conferido</option>
        </select>
      </div>

      <div class="documentos__table-wrap">
        <table class="documentos__table" aria-label="Lista de documentos">
          <thead>
            <tr>
              <th scope="col">Documento</th>
              <th scope="col">Cliente</th>
              <th scope="col">Competência</th>
              <th scope="col">Status</th>
              <th scope="col">Obs</th>
              <th scope="col"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody id="docs-tbody" aria-live="polite">
            ${skeletonRows()}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/** @returns {string} Skeleton rows */
function skeletonRows() {
  return Array(5)
    .fill(
      `
    <tr aria-hidden="true">
      ${Array(6).fill('<td><div class="skeleton" style="height:14px;border-radius:4px"></div></td>').join("")}
    </tr>
  `,
    )
    .join("");
}

/**
 * Popula o select de clientes.
 * @param {HTMLElement} container
 */
function renderFiltroClientes(container) {
  const sel = container.querySelector("#doc-filtro-cliente");
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
 * Renderiza as linhas da tabela.
 * @param {HTMLElement} container
 */
function renderTabela(container) {
  const docs = getState("documentos") || {};
  const clientes = getState("clientes") || {};
  const tbody = container.querySelector("#docs-tbody");
  if (!tbody) return;

  const lista = Object.entries(docs)
    .filter(([, d]) => {
      if (filtroCliente && d.clienteId !== filtroCliente) return false;
      if (filtroStatus && d.status !== filtroStatus) return false;
      if (
        filtroBusca &&
        !d.nome?.toLowerCase().includes(filtroBusca.toLowerCase())
      )
        return false;
      return true;
    })
    .sort(([, a], [, b]) => (b.criadoEm || 0) - (a.criadoEm || 0));

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state" role="status">
            <i class="ph ph-file-dashed empty-state__icon" aria-hidden="true"></i>
            <p class="empty-state__title">Nenhum documento encontrado</p>
            <p class="empty-state__desc">Ajuste os filtros ou registre um novo documento.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lista
    .map(([id, d]) => {
      const cliente = clientes[d.clienteId];
      const nextLabel = STATUS_NEXT_LABEL[d.status];

      return `
      <tr class="docs-row" data-id="${id}">
        <td class="docs-row__nome">${d.nome || "—"}</td>
        <td>${cliente?.nome || "—"}</td>
        <td>${formatCompetencia(d.competencia)}</td>
        <td>
          <button class="badge ${STATUS_BADGE[d.status]} docs-status-btn"
            data-id="${id}" data-status="${d.status}"
            ${!nextLabel ? "disabled" : ""}
            aria-label="${nextLabel || "Status final: " + STATUS_LABELS[d.status]}"
            title="${nextLabel || STATUS_LABELS[d.status]}">
            ${STATUS_LABELS[d.status]}
            ${nextLabel ? '<i class="ph ph-arrow-right" aria-hidden="true"></i>' : ""}
          </button>
        </td>
        <td class="docs-row__obs">${d.obs || "—"}</td>
        <td class="docs-row__actions">
          <button class="btn btn--ghost btn--sm docs-edit" data-id="${id}" aria-label="Editar documento">
            <i class="ph ph-pencil-simple" aria-hidden="true"></i>
          </button>
          <button class="btn btn--ghost btn--sm docs-delete" data-id="${id}" aria-label="Excluir documento">
            <i class="ph ph-trash" aria-hidden="true"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  // Bind status toggle
  tbody.querySelectorAll(".docs-status-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await avancarStatusDocumento(btn.dataset.id, btn.dataset.status);
      } catch {
        showToast("Erro ao atualizar status.", "error");
      }
    });
  });

  // Bind editar
  tbody.querySelectorAll(".docs-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const docs = getState("documentos") || {};
      openDocModal({ id, doc: docs[id] });
    });
  });

  // Bind excluir
  tbody.querySelectorAll(".docs-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const docs = getState("documentos") || {};
      const d = docs[id];
      openConfirmModal({
        title: "Excluir documento",
        message: `Excluir <strong>${d?.nome}</strong>?`,
        confirmLabel: "Excluir",
        onConfirm: async () => {
          try {
            await excluirDocumento(id);
            showToast("Documento excluído.", "success");
          } catch {
            showToast("Erro ao excluir documento.", "error");
          }
        },
      });
    });
  });
}

/**
 * Abre o modal de criação/edição de documento.
 * @param {Object} [opts]
 */
function openDocModal({ id = null, doc = null } = {}) {
  const isEdit = !!id;
  const clientes = getState("clientes") || {};

  const body = `
    <form id="form-doc" novalidate>
      <fieldset style="border:none;padding:0;display:contents">
        <legend class="sr-only">${isEdit ? "Editar Documento" : "Novo Documento"}</legend>
        <div class="form-grid">
          <div class="form-group form-grid--full">
            <label class="form-group__label" for="d-nome">Nome do Documento *</label>
            <input class="input" type="text" id="d-nome" name="nome"
              value="${doc?.nome || ""}" required aria-required="true" aria-describedby="err-d-nome"/>
            <span class="form-group__error" id="err-d-nome" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="d-cliente">Cliente</label>
            <select class="input" id="d-cliente" name="clienteId">
              <option value="">Sem cliente</option>
              ${Object.entries(clientes)
                .sort(([, a], [, b]) =>
                  (a.nome || "").localeCompare(b.nome || ""),
                )
                .map(
                  ([cid, c]) =>
                    `<option value="${cid}" ${doc?.clienteId === cid ? "selected" : ""}>${c.nome}</option>`,
                )
                .join("")}
            </select>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="d-competencia">Competência</label>
            <input class="input" type="month" id="d-competencia" name="competencia"
              value="${doc?.competencia || ""}"/>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="d-status">Status</label>
            <select class="input" id="d-status" name="status">
              <option value="pendente"  ${(doc?.status || "pendente") === "pendente" ? "selected" : ""}>Pendente</option>
              <option value="recebido"  ${doc?.status === "recebido" ? "selected" : ""}>Recebido</option>
              <option value="conferido" ${doc?.status === "conferido" ? "selected" : ""}>Conferido</option>
            </select>
          </div>

          <div class="form-group form-grid--full">
            <label class="form-group__label" for="d-obs">Observações</label>
            <textarea class="input" id="d-obs" name="obs" rows="2">${doc?.obs || ""}</textarea>
          </div>
        </div>
      </fieldset>
    </form>
  `;

  openModal({
    title: isEdit ? "Editar Documento" : "Novo Documento",
    body,
    size: "md",
    actions: [
      {
        label: "Cancelar",
        cls: "btn--secondary",
        action: ({ close }) => close(),
      },
      {
        label: isEdit ? "Salvar" : "Registrar",
        cls: "btn--primary",
        action: ({ close }) => submitDoc(close, id),
      },
    ],
  });
}

/**
 * Submete o formulário de documento.
 * @param {function} close
 * @param {string|null} id
 */
async function submitDoc(close, id) {
  const form = document.getElementById("form-doc");
  if (!form) return;

  const dados = {
    nome: form.elements["nome"].value.trim(),
    clienteId: form.elements["clienteId"].value,
    competencia: form.elements["competencia"].value,
    status: form.elements["status"].value,
    obs: form.elements["obs"].value.trim(),
  };

  if (!required(dados.nome)) {
    form.elements["nome"]
      .closest(".form-group")
      ?.classList.add("form-group--invalid");
    const err = document.getElementById("err-d-nome");
    if (err) err.textContent = "Nome é obrigatório.";
    return;
  }

  try {
    if (id) {
      await atualizarDocumento(id, dados);
      showToast("Documento atualizado.", "success");
    } else {
      await criarDocumento(dados);
      showToast("Documento registrado.", "success");
    }
    close();
  } catch {
    showToast("Erro ao salvar documento.", "error");
  }
}

/**
 * Vincula eventos dos filtros.
 * @param {HTMLElement} container
 */
function bindPageEvents(container) {
  container
    .querySelector("#btn-novo-doc")
    .addEventListener("click", () => openDocModal());

  container.querySelector("#doc-busca").addEventListener("input", (e) => {
    filtroBusca = e.target.value;
    renderTabela(container);
  });

  container
    .querySelector("#doc-filtro-cliente")
    .addEventListener("change", (e) => {
      filtroCliente = e.target.value;
      renderTabela(container);
    });

  container
    .querySelector("#doc-filtro-status")
    .addEventListener("change", (e) => {
      filtroStatus = e.target.value;
      renderTabela(container);
    });
}
