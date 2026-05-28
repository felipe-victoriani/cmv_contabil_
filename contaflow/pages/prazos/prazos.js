/**
 * prazos.js — Página de Prazos Fiscais
 */
import {
  watchPrazos,
  criarPrazo,
  atualizarPrazo,
  excluirPrazo,
  togglePrazo,
} from "../../services/prazos.service.js";
import { watchClientes } from "../../services/clientes.service.js";
import { watchUsuarios } from "../../services/usuarios.service.js";
import { setState, getState } from "../../store/app.store.js";
import { showToast } from "../../components/toast/toast.js";
import { openModal, openConfirmModal } from "../../components/modal/modal.js";
import { injectCSS, removeCSS } from "../../utils/css.utils.js";
import {
  formatDate,
  mesAtual,
  deslocarMes,
  nomesMes,
  urgenciaClass,
} from "../../utils/date.utils.js";
import { required } from "../../utils/validators.js";

const CSS_ID = "css-prazos";

const TIPOS = [
  "DARF",
  "DAS",
  "SPED Fiscal",
  "SPED Contribuições",
  "eSocial",
  "EFD-Reinf",
  "DCTF",
  "DEFIS",
  "DIRF",
  "Folha",
  "Outro",
];

/** @type {function|null} */ let unsubPrazos = null;
/** @type {function|null} */ let unsubClientes = null;
/** @type {function|null} */ let unsubUsuarios = null;
/** @type {string} */ let mesFiltro = mesAtual();
/** @type {string} */ let filtroResponsavel = "";

/**
 * Monta a página de prazos.
 * @param {HTMLElement} container
 */
export function mount(container) {
  injectCSS("pages/prazos/prazos.css", CSS_ID);
  container.innerHTML = templateShell();
  bindPageEvents(container);

  unsubClientes = watchClientes((data) => {
    setState("clientes", data);
    renderPrazos(container);
  });

  unsubPrazos = watchPrazos((data) => {
    setState("prazos", data);
    renderPrazos(container);
  });

  unsubUsuarios = watchUsuarios((data) => {
    setState("usuarios", data);
    renderFiltroResponsaveis(container);
    renderPrazos(container);
  });
}

/** Remove a página de prazos. */
export function unmount() {
  unsubPrazos?.();
  unsubClientes?.();
  unsubUsuarios?.();
  unsubPrazos = unsubClientes = unsubUsuarios = null;
  mesFiltro = mesAtual();
  filtroResponsavel = "";
}

/** @returns {string} HTML do shell */
function templateShell() {
  return `
    <section class="prazos" aria-label="Prazos Fiscais">
      <header class="prazos__header">
        <h1 class="prazos__title">Prazos Fiscais</h1>
        <button class="btn btn--primary" id="btn-novo-prazo" aria-label="Adicionar prazo">
          <i class="ph ph-plus" aria-hidden="true"></i>
          <span>Novo Prazo</span>
        </button>
      </header>

      <div class="prazos__nav" aria-label="Navegação por mês">
        <button class="btn btn--ghost" id="btn-mes-prev" aria-label="Mês anterior">
          <i class="ph ph-caret-left" aria-hidden="true"></i>
        </button>
        <span class="prazos__mes-label" id="prazos-mes-label"></span>
        <button class="btn btn--ghost" id="btn-mes-next" aria-label="Próximo mês">
          <i class="ph ph-caret-right" aria-hidden="true"></i>
        </button>
      </div>

      <div class="prazos__filtros">
        <select class="input" id="prazos-filtro-responsavel" aria-label="Filtrar por responsável">
          <option value="">Todos os responsáveis</option>
        </select>
      </div>

      <div class="prazos__list" id="prazos-list" aria-live="polite">
        ${skeletonPrazos()}
      </div>
    </section>
  `;
}

/** @returns {string} Skeleton */
function skeletonPrazos() {
  return Array(5)
    .fill(
      `
    <div class="card prazo-item--skeleton" aria-hidden="true">
      <div class="skeleton" style="height:16px;width:30%;margin-bottom:8px"></div>
      <div class="skeleton" style="height:14px;width:55%"></div>
    </div>
  `,
    )
    .join("");
}

/**
 * Atualiza o select de filtro de responsáveis.
 * @param {HTMLElement} container
 */
function renderFiltroResponsaveis(container) {
  const sel = container.querySelector("#prazos-filtro-responsavel");
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
 * Renderiza a lista de prazos do mês filtrado.
 * @param {HTMLElement} container
 */
function renderPrazos(container) {
  const prazos = getState("prazos") || {};
  const clientes = getState("clientes") || {};
  const usuarios = getState("usuarios") || {};
  const label = container.querySelector("#prazos-mes-label");
  const list = container.querySelector("#prazos-list");
  if (!list) return;

  if (label) label.textContent = nomesMes(mesFiltro);

  const lista = Object.entries(prazos)
    .filter(([, p]) => p.data?.startsWith(mesFiltro))
    .filter(
      ([, p]) => !filtroResponsavel || p.responsavelId === filtroResponsavel,
    )
    .sort(([, a], [, b]) => (a.data || "").localeCompare(b.data || ""));

  if (!lista.length) {
    list.innerHTML = `
      <div class="empty-state" role="status">
        <i class="ph ph-calendar-blank empty-state__icon" aria-hidden="true"></i>
        <p class="empty-state__title">Sem prazos neste mês</p>
        <p class="empty-state__desc">Adicione prazos fiscais para este período.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = lista
    .map(([id, p]) => {
      const cliente = clientes[p.clienteId];
      const responsavel = p.responsavelId ? usuarios[p.responsavelId] : null;
      const urgencia = urgenciaClass(p.data, p.done);

      const urgLabel = {
        ok: "No prazo",
        warning: "Urgente",
        danger: "Vencido",
        done: "Concluído",
      }[urgencia];

      return `
      <div class="card prazo-item prazo-item--${urgencia} ${p.done ? "prazo-item--done" : ""}"
           data-id="${id}"
           role="article"
           aria-label="Prazo ${p.tipo}${p.done ? " — concluído" : ""}, ${urgLabel}">
        <div class="prazo-item__left">
          <button class="prazo-item__check"
            data-id="${id}" data-done="${p.done ? "1" : "0"}"
            aria-label="${p.done ? "Reabrir prazo" : "Marcar como concluído"}"
            aria-pressed="${p.done}">
            <i class="ph ${p.done ? "ph-check-square" : "ph-square"}" aria-hidden="true"></i>
          </button>

          <div class="prazo-item__info">
            <div class="prazo-item__header">
              <span class="prazo-item__tipo">${p.tipo}</span>
              <span class="badge badge--${urgencia === "ok" ? "success" : urgencia === "done" ? "neutral" : urgencia === "warning" ? "warning" : "danger"}">
                ${urgLabel}
              </span>
            </div>

            <div class="prazo-item__meta">
              <span><i class="ph ph-calendar" aria-hidden="true"></i> ${formatDate(p.data)}</span>
              ${cliente ? `<span><i class="ph ph-building-office" aria-hidden="true"></i> ${cliente.nome}</span>` : ""}
              ${responsavel ? `<span><i class="ph ph-user" aria-hidden="true"></i> ${responsavel.nome}</span>` : ""}
              ${p.obs ? `<span><i class="ph ph-note" aria-hidden="true"></i> ${p.obs}</span>` : ""}
            </div>
          </div>
        </div>

        <div class="prazo-item__actions">
          <button class="btn btn--ghost btn--sm prazo-item__edit" data-id="${id}" aria-label="Editar prazo">
            <i class="ph ph-pencil-simple" aria-hidden="true"></i>
          </button>
          <button class="btn btn--ghost btn--sm prazo-item__delete" data-id="${id}" aria-label="Excluir prazo">
            <i class="ph ph-trash" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;
    })
    .join("");

  // Bind eventos
  list.querySelectorAll(".prazo-item__check").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const done = btn.dataset.done !== "1";
      try {
        await togglePrazo(btn.dataset.id, done);
      } catch {
        showToast("Erro ao atualizar prazo.", "error");
      }
    });
  });

  list.querySelectorAll(".prazo-item__edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const prazos = getState("prazos") || {};
      openPrazoModal({ id, prazo: prazos[id] });
    });
  });

  list.querySelectorAll(".prazo-item__delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const prazos = getState("prazos") || {};
      const p = prazos[id];
      openConfirmModal({
        title: "Excluir prazo",
        message: `Excluir o prazo <strong>${p?.tipo}</strong> de ${formatDate(p?.data)}?`,
        confirmLabel: "Excluir",
        onConfirm: async () => {
          try {
            await excluirPrazo(id);
            showToast("Prazo excluído.", "success");
          } catch {
            showToast("Erro ao excluir prazo.", "error");
          }
        },
      });
    });
  });
}

/**
 * Abre o modal de criação/edição de prazo.
 * @param {Object} [opts]
 */
function openPrazoModal({ id = null, prazo = null } = {}) {
  const isEdit = !!id;
  const clientes = getState("clientes") || {};
  const usuarios = getState("usuarios") || {};

  const body = `
    <form id="form-prazo" novalidate>
      <fieldset style="border:none;padding:0;display:contents">
        <legend class="sr-only">${isEdit ? "Editar Prazo" : "Novo Prazo"}</legend>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-group__label" for="p-tipo">Tipo de Obrigação *</label>
            <select class="input" id="p-tipo" name="tipo" required aria-required="true" aria-describedby="err-p-tipo">
              <option value="">Selecione...</option>
              ${TIPOS.map((t) => `<option value="${t}" ${prazo?.tipo === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>
            <span class="form-group__error" id="err-p-tipo" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="p-data">Data de Vencimento *</label>
            <input class="input" type="date" id="p-data" name="data"
              value="${prazo?.data || ""}" required aria-required="true" aria-describedby="err-p-data"/>
            <span class="form-group__error" id="err-p-data" role="alert"></span>
          </div>

          <div class="form-group form-grid--full">
            <label class="form-group__label" for="p-cliente">Cliente</label>
            <select class="input" id="p-cliente" name="clienteId">
              <option value="">Sem cliente específico</option>
              ${Object.entries(clientes)
                .sort(([, a], [, b]) =>
                  (a.nome || "").localeCompare(b.nome || ""),
                )
                .map(
                  ([cid, c]) =>
                    `<option value="${cid}" ${prazo?.clienteId === cid ? "selected" : ""}>${c.nome}</option>`,
                )
                .join("")}
            </select>
          </div>

          <div class="form-group form-grid--full">
            <label class="form-group__label" for="p-responsavel">Responsável</label>
            <select class="input" id="p-responsavel" name="responsavelId">
              <option value="">Sem responsável</option>
              ${Object.entries(usuarios)
                .sort(([, a], [, b]) =>
                  (a.nome || "").localeCompare(b.nome || ""),
                )
                .map(
                  ([uid, u]) =>
                    `<option value="${uid}" ${prazo?.responsavelId === uid ? "selected" : ""}>${u.nome}</option>`,
                )
                .join("")}
            </select>
          </div>

          <div class="form-group form-grid--full">
            <label class="form-group__label" for="p-obs">Observações</label>
            <textarea class="input" id="p-obs" name="obs" rows="2">${prazo?.obs || ""}</textarea>
          </div>
        </div>
      </fieldset>
    </form>
  `;

  openModal({
    title: isEdit ? "Editar Prazo" : "Novo Prazo",
    body,
    size: "md",
    actions: [
      {
        label: "Cancelar",
        cls: "btn--secondary",
        action: ({ close }) => close(),
      },
      {
        label: isEdit ? "Salvar" : "Adicionar",
        cls: "btn--primary",
        action: ({ close }) => submitPrazo(close, id),
      },
    ],
  });
}

/**
 * Submete o formulário de prazo.
 * @param {function} close
 * @param {string|null} id
 */
async function submitPrazo(close, id) {
  const form = document.getElementById("form-prazo");
  if (!form) return;

  const dados = {
    tipo: form.elements["tipo"].value,
    data: form.elements["data"].value,
    clienteId: form.elements["clienteId"].value,
    responsavelId: form.elements["responsavelId"].value,
    obs: form.elements["obs"].value.trim(),
  };

  let hasError = false;
  const setErr = (name, msg) => {
    const input = form.elements[name];
    input?.closest(".form-group")?.classList.add("form-group--invalid");
    const err = form.querySelector(`#err-p-${name}`);
    if (err) err.textContent = msg;
    hasError = true;
  };

  if (!required(dados.tipo)) setErr("tipo", "Tipo é obrigatório.");
  if (!required(dados.data)) setErr("data", "Data é obrigatória.");
  if (hasError) return;

  try {
    if (id) {
      await atualizarPrazo(id, dados);
      showToast("Prazo atualizado.", "success");
    } else {
      await criarPrazo(dados);
      showToast("Prazo adicionado.", "success");
    }
    close();
  } catch {
    showToast("Erro ao salvar prazo.", "error");
  }
}

/**
 * Vincula eventos de navegação de mês.
 * @param {HTMLElement} container
 */
function bindPageEvents(container) {
  container
    .querySelector("#btn-novo-prazo")
    .addEventListener("click", () => openPrazoModal());

  container.querySelector("#btn-mes-prev").addEventListener("click", () => {
    mesFiltro = deslocarMes(mesFiltro, -1);
    renderPrazos(container);
  });

  container.querySelector("#btn-mes-next").addEventListener("click", () => {
    mesFiltro = deslocarMes(mesFiltro, +1);
    renderPrazos(container);
  });

  container
    .querySelector("#prazos-filtro-responsavel")
    .addEventListener("change", (e) => {
      filtroResponsavel = e.target.value;
      renderPrazos(container);
    });
}
