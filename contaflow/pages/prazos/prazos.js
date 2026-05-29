/**
 * prazos.js — Página de Prazos Fiscais
 */
import {
  watchPrazos,
  criarPrazo,
  atualizarPrazo,
  excluirPrazo,
  togglePrazo,
  watchTemplates,
  criarTemplate,
  excluirTemplate,
  gerarDoTemplates,
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
/** @type {function|null} */ let unsubTemplates = null;
/** @type {string} */ let mesFiltro = mesAtual();
/** @type {string} */ let filtroResponsavel = "";

/**
 * Monta a página de prazos.
 * @param {HTMLElement} container
 */
export async function mount(container) {
  await injectCSS("pages/prazos/prazos.css", CSS_ID);
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

  unsubTemplates = watchTemplates((data) => {
    setState("prazoTemplates", data);
  });

  // Auto-gera prazos do mês atual e do próximo com base nos templates
  autoGerarMeses();
}

/** Remove a página de prazos. */
export function unmount() {
  unsubPrazos?.();
  unsubClientes?.();
  unsubUsuarios?.();
  unsubTemplates?.();
  unsubPrazos = unsubClientes = unsubUsuarios = unsubTemplates = null;
  mesFiltro = mesAtual();
  filtroResponsavel = "";
}

/** @returns {string} HTML do shell */
function templateShell() {
  return `
    <section class="prazos" aria-label="Prazos Fiscais">
      <header class="prazos__header">
        <h1 class="prazos__title">Prazos Fiscais</h1>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn--secondary" id="btn-templates" aria-label="Gerenciar templates recorrentes">
            <i class="ph ph-repeat" aria-hidden="true"></i>
            <span>Recorrentes</span>
          </button>
          <button class="btn btn--primary" id="btn-novo-prazo" aria-label="Adicionar prazo">
            <i class="ph ph-plus" aria-hidden="true"></i>
            <span>Novo Prazo</span>
          </button>
        </div>
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

  container
    .querySelector("#btn-templates")
    .addEventListener("click", () => openTemplatesModal());

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

// ── Templates recorrentes ───────────────────────────────

/**
 * Gera prazos silenciosamente para o mês atual e o próximo.
 */
async function autoGerarMeses() {
  const atual = mesAtual();
  const proximo = deslocarMes(atual, 1);
  try {
    const [n1, n2] = await Promise.all([
      gerarDoTemplates(atual),
      gerarDoTemplates(proximo),
    ]);
    const total = n1 + n2;
    if (total > 0) {
      showToast(
        `${total} prazo${total > 1 ? "s" : ""} gerado${total > 1 ? "s" : ""} automaticamente.`,
        "info",
      );
    }
  } catch {
    // Silencioso — não interrompe a página
  }
}

/**
 * Abre o modal de gerenciamento de templates recorrentes.
 */
function openTemplatesModal() {
  const clientes = getState("clientes") || {};
  const usuarios = getState("usuarios") || {};

  const renderLista = () => {
    const templates = getState("prazoTemplates") || {};
    const entries = Object.entries(templates);
    if (!entries.length) {
      return `<p class="templates-empty">Nenhum template cadastrado.</p>`;
    }
    return entries
      .map(([id, t]) => {
        const clienteNome =
          t.clienteId && clientes[t.clienteId]
            ? clientes[t.clienteId].nome
            : "Todos";
        return `
          <div class="template-item" data-id="${id}">
            <div class="template-item__info">
              <strong>${t.tipo}</strong> — dia <strong>${t.dia}</strong>
              <span class="template-item__meta">${clienteNome}${t.obs ? ` · ${t.obs}` : ""}</span>
            </div>
            <button class="btn btn--ghost btn--sm template-item__del" data-id="${id}" aria-label="Excluir template">
              <i class="ph ph-trash" aria-hidden="true"></i>
            </button>
          </div>
        `;
      })
      .join("");
  };

  const body = `
    <div id="templates-modal-body">
      <div id="templates-lista" style="margin-bottom:var(--space-5)">
        ${renderLista()}
      </div>
      <hr style="border:none;border-top:1px solid var(--color-border);margin-bottom:var(--space-5)">
      <p style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--space-3);color:var(--color-muted);text-transform:uppercase;letter-spacing:.5px">Novo template</p>
      <form id="form-template" novalidate>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-group__label" for="tmpl-tipo">Tipo *</label>
            <select class="input" id="tmpl-tipo" name="tipo" required>
              <option value="">Selecione...</option>
              ${TIPOS.map((t) => `<option value="${t}">${t}</option>`).join("")}
            </select>
            <span class="form-group__error" id="err-tmpl-tipo" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="tmpl-dia">Dia do mês *</label>
            <input class="input" type="number" id="tmpl-dia" name="dia"
              min="1" max="31" placeholder="Ex: 20" required aria-describedby="err-tmpl-dia"/>
            <span class="form-group__error" id="err-tmpl-dia" role="alert"></span>
          </div>

          <div class="form-group form-grid--full">
            <label class="form-group__label" for="tmpl-cliente">Cliente</label>
            <select class="input" id="tmpl-cliente" name="clienteId">
              <option value="">Todos os clientes</option>
              ${Object.entries(clientes)
                .sort(([, a], [, b]) =>
                  (a.nome || "").localeCompare(b.nome || ""),
                )
                .map(([cid, c]) => `<option value="${cid}">${c.nome}</option>`)
                .join("")}
            </select>
          </div>

          <div class="form-group form-grid--full">
            <label class="form-group__label" for="tmpl-responsavel">Responsável</label>
            <select class="input" id="tmpl-responsavel" name="responsavelId">
              <option value="">Sem responsável</option>
              ${Object.entries(usuarios)
                .sort(([, a], [, b]) =>
                  (a.nome || "").localeCompare(b.nome || ""),
                )
                .map(([uid, u]) => `<option value="${uid}">${u.nome}</option>`)
                .join("")}
            </select>
          </div>

          <div class="form-group form-grid--full">
            <label class="form-group__label" for="tmpl-obs">Observação</label>
            <input class="input" type="text" id="tmpl-obs" name="obs" placeholder="Ex: Competência anterior"/>
          </div>
        </div>
        <button type="submit" class="btn btn--primary" style="margin-top:var(--space-3);width:100%">
          <i class="ph ph-plus" aria-hidden="true"></i> Adicionar Template
        </button>
      </form>
    </div>
  `;

  openModal({
    title: "Prazos Recorrentes",
    body,
    size: "md",
    actions: [
      {
        label: "Fechar",
        cls: "btn--secondary",
        action: ({ close }) => close(),
      },
    ],
  });

  // O modal é renderizado de forma síncrona — vincula eventos imediatamente
  bindTemplatesModal();
}

/**
 * Vincula eventos dentro do modal de templates.
 */
function bindTemplatesModal() {
  // Excluir template
  document.querySelectorAll(".template-item__del").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      try {
        await excluirTemplate(id);
        showToast("Template removido.", "success");
        // Re-renderiza a lista no modal
        const lista = document.getElementById("templates-lista");
        if (lista)
          lista.innerHTML = (() => {
            const templates = getState("prazoTemplates") || {};
            const clientes = getState("clientes") || {};
            const entries = Object.entries(templates);
            if (!entries.length)
              return `<p class="templates-empty">Nenhum template cadastrado.</p>`;
            return entries
              .map(([tid, t]) => {
                const clienteNome =
                  t.clienteId && clientes[t.clienteId]
                    ? clientes[t.clienteId].nome
                    : "Todos";
                return `
              <div class="template-item" data-id="${tid}">
                <div class="template-item__info">
                  <strong>${t.tipo}</strong> — dia <strong>${t.dia}</strong>
                  <span class="template-item__meta">${clienteNome}${t.obs ? ` · ${t.obs}` : ""}</span>
                </div>
                <button class="btn btn--ghost btn--sm template-item__del" data-id="${tid}" aria-label="Excluir template">
                  <i class="ph ph-trash" aria-hidden="true"></i>
                </button>
              </div>
            `;
              })
              .join("");
          })();
        bindTemplatesModal();
      } catch {
        showToast("Erro ao remover template.", "error");
      }
    });
  });

  // Criar template
  const form = document.getElementById("form-template");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const tipo = form.elements["tipo"].value;
    const dia = parseInt(form.elements["dia"].value, 10);
    let hasError = false;

    const setErr = (name, msg) => {
      const err = document.getElementById(`err-tmpl-${name}`);
      form.elements[name]
        ?.closest(".form-group")
        ?.classList.add("form-group--invalid");
      if (err) err.textContent = msg;
      hasError = true;
    };

    if (!tipo) setErr("tipo", "Tipo é obrigatório.");
    if (!dia || dia < 1 || dia > 31)
      setErr("dia", "Informe um dia entre 1 e 31.");
    if (hasError) return;

    const dados = {
      tipo,
      dia,
      clienteId: form.elements["clienteId"].value,
      responsavelId: form.elements["responsavelId"].value,
      obs: form.elements["obs"].value.trim(),
    };

    const submitBtn = form.querySelector("[type=submit]");
    submitBtn.disabled = true;

    try {
      await criarTemplate(dados);
      showToast(
        "Template criado! Prazos serão gerados automaticamente.",
        "success",
      );
      // Gera imediatamente para mês atual e próximo
      await Promise.all([
        gerarDoTemplates(mesAtual()),
        gerarDoTemplates(deslocarMes(mesAtual(), 1)),
      ]);
      form.reset();
      // Re-renderiza lista
      const lista = document.getElementById("templates-lista");
      if (lista) {
        const templates = getState("prazoTemplates") || {};
        const clientes = getState("clientes") || {};
        const entries = Object.entries(templates);
        lista.innerHTML = !entries.length
          ? `<p class="templates-empty">Nenhum template cadastrado.</p>`
          : entries
              .map(([tid, t]) => {
                const clienteNome =
                  t.clienteId && clientes[t.clienteId]
                    ? clientes[t.clienteId].nome
                    : "Todos";
                return `
                <div class="template-item" data-id="${tid}">
                  <div class="template-item__info">
                    <strong>${t.tipo}</strong> — dia <strong>${t.dia}</strong>
                    <span class="template-item__meta">${clienteNome}${t.obs ? ` · ${t.obs}` : ""}</span>
                  </div>
                  <button class="btn btn--ghost btn--sm template-item__del" data-id="${tid}" aria-label="Excluir template">
                    <i class="ph ph-trash" aria-hidden="true"></i>
                  </button>
                </div>
              `;
              })
              .join("");
        bindTemplatesModal();
      }
    } catch {
      showToast("Erro ao criar template.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}
