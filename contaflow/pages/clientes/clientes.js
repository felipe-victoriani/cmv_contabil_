/**
 * clientes.js — Página de Clientes
 */
import {
  watchClientes,
  criarCliente,
  atualizarCliente,
  excluirCliente,
} from "../../services/clientes.service.js";
import { watchTarefas } from "../../services/tarefas.service.js";
import { watchDocumentos } from "../../services/documentos.service.js";
import { setState, getState } from "../../store/app.store.js";
import { showToast } from "../../components/toast/toast.js";
import { openModal, openConfirmModal } from "../../components/modal/modal.js";
import { injectCSS, removeCSS } from "../../utils/css.utils.js";
import { applyMasks } from "../../utils/mask.utils.js";
import {
  validarCNPJ,
  validarCPF,
  validarEmail,
  required,
} from "../../utils/validators.js";
import { formatDate } from "../../utils/date.utils.js";

const CSS_ID = "css-clientes";

const REGIMES = ["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI"];

/** @type {function|null} Unsubscribe clientes */
let unsubClientes = null;
/** @type {function|null} Unsubscribe tarefas */
let unsubTarefas = null;
/** @type {function|null} Unsubscribe documentos */
let unsubDocumentos = null;

/** @type {string} Filtro de busca atual */
let filtro = "";

/**
 * Monta a página de clientes.
 * @param {HTMLElement} container
 */
export function mount(container) {
  injectCSS("pages/clientes/clientes.css", CSS_ID);
  container.innerHTML = templateShell();
  bindPageEvents(container);

  // Escuta dados em tempo real
  unsubClientes = watchClientes((data) => {
    setState("clientes", data);
    renderCards(container);
  });

  unsubTarefas = watchTarefas((data) => {
    setState("tarefas", data);
    renderCards(container);
  });

  unsubDocumentos = watchDocumentos((data) => {
    setState("documentos", data);
    renderCards(container);
  });
}

/** Remove a página de clientes. */
export function unmount() {
  unsubClientes?.();
  unsubTarefas?.();
  unsubDocumentos?.();
  unsubClientes = unsubTarefas = unsubDocumentos = null;
  filtro = "";
  removeCSS(CSS_ID);
}

/** @returns {string} HTML do shell da página */
function templateShell() {
  return `
    <section class="clientes" aria-label="Clientes">
      <header class="clientes__header">
        <div class="clientes__header-left">
          <h1 class="clientes__title">Clientes</h1>
        </div>
        <div class="clientes__header-right">
          <div class="clientes__search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
            <input
              class="input clientes__search-input"
              type="search"
              id="clientes-busca"
              placeholder="Buscar cliente..."
              aria-label="Buscar clientes"
              autocomplete="off"
            />
          </div>
          <button class="btn btn--primary" id="btn-novo-cliente" aria-label="Cadastrar novo cliente">
            <i class="ph ph-plus" aria-hidden="true"></i>
            <span>Novo Cliente</span>
          </button>
        </div>
      </header>

      <div class="clientes__grid" id="clientes-grid" aria-live="polite">
        ${skeletonCards()}
      </div>
    </section>
  `;
}

/** @returns {string} Skeleton de carregamento */
function skeletonCards() {
  return Array(6)
    .fill(
      `
    <div class="card cliente-card--skeleton" aria-hidden="true">
      <div class="skeleton" style="height:20px;width:60%;margin-bottom:8px"></div>
      <div class="skeleton" style="height:14px;width:80%;margin-bottom:6px"></div>
      <div class="skeleton" style="height:14px;width:50%"></div>
    </div>
  `,
    )
    .join("");
}

/**
 * Renderiza os cards de clientes filtrados.
 * @param {HTMLElement} container
 */
function renderCards(container) {
  const clientes = getState("clientes") || {};
  const tarefas = getState("tarefas") || {};
  const documentos = getState("documentos") || {};
  const grid = container.querySelector("#clientes-grid");
  if (!grid) return;

  const lista = Object.entries(clientes)
    .filter(
      ([, c]) =>
        !filtro || c.nome?.toLowerCase().includes(filtro.toLowerCase()),
    )
    .sort(([, a], [, b]) => (a.nome || "").localeCompare(b.nome || ""));

  if (!lista.length) {
    grid.innerHTML = `
      <div class="empty-state clientes__empty" role="status">
        <i class="ph ph-users empty-state__icon" aria-hidden="true"></i>
        <p class="empty-state__title">${filtro ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</p>
        <p class="empty-state__desc">${filtro ? "Tente outro termo de busca." : 'Cadastre o primeiro cliente clicando em "Novo Cliente".'}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = lista
    .map(([id, c]) => {
      const pendentes = Object.values(tarefas).filter(
        (t) => t.clienteId === id && t.status !== "done",
      ).length;
      const docsAbertos = Object.values(documentos).filter(
        (d) => d.clienteId === id && d.status !== "conferido",
      ).length;

      return `
      <article class="card cliente-card" data-id="${id}" aria-label="Cliente ${c.nome}">
        <div class="cliente-card__header">
          <div class="cliente-card__avatar" aria-hidden="true">${(c.nome || "?")[0].toUpperCase()}</div>
          <div class="cliente-card__info">
            <h2 class="cliente-card__nome">${c.nome || "—"}</h2>
            <span class="badge badge--neutral cliente-card__regime">${c.regime || "—"}</span>
          </div>
          <div class="cliente-card__menu-wrap">
            <button class="btn btn--ghost btn--sm cliente-card__menu-btn"
              aria-label="Opções de ${c.nome}"
              data-id="${id}"
              aria-haspopup="true"
              aria-expanded="false">
              <i class="ph ph-dots-three-vertical" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <div class="cliente-card__details">
          ${c.cnpj ? `<span class="cliente-card__detail"><i class="ph ph-identification-card" aria-hidden="true"></i>${c.cnpj}</span>` : ""}
          ${c.responsavel ? `<span class="cliente-card__detail"><i class="ph ph-user" aria-hidden="true"></i>${c.responsavel}</span>` : ""}
          ${c.tel ? `<span class="cliente-card__detail"><i class="ph ph-phone" aria-hidden="true"></i>${c.tel}</span>` : ""}
          ${c.email ? `<span class="cliente-card__detail"><i class="ph ph-envelope" aria-hidden="true"></i>${c.email}</span>` : ""}
        </div>

        <div class="cliente-card__badges">
          ${pendentes > 0 ? `<span class="badge badge--warning" title="Tarefas pendentes"><i class="ph ph-check-square" aria-hidden="true"></i> ${pendentes} tarefa${pendentes > 1 ? "s" : ""}</span>` : ""}
          ${docsAbertos > 0 ? `<span class="badge badge--info" title="Documentos em aberto"><i class="ph ph-file" aria-hidden="true"></i> ${docsAbertos} doc${docsAbertos > 1 ? "s" : ""}</span>` : ""}
        </div>
      </article>
    `;
    })
    .join("");

  // Bind eventos dos cards
  grid.querySelectorAll(".cliente-card__menu-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openClienteMenu(btn, btn.dataset.id, container);
    });
  });
}

/**
 * Abre o dropdown de opções do cliente.
 * @param {HTMLElement} btn
 * @param {string} id
 * @param {HTMLElement} container
 */
function openClienteMenu(btn, id, container) {
  document.querySelectorAll(".cliente-dropdown").forEach((d) => d.remove());

  const clientes = getState("clientes") || {};
  const cliente = clientes[id];
  if (!cliente) return;

  const dropdown = document.createElement("div");
  dropdown.className = "cliente-dropdown";
  dropdown.setAttribute("role", "menu");
  dropdown.innerHTML = `
    <button class="cliente-dropdown__item" data-action="edit" role="menuitem">
      <i class="ph ph-pencil-simple" aria-hidden="true"></i> Editar
    </button>
    <button class="cliente-dropdown__item cliente-dropdown__item--danger" data-action="delete" role="menuitem">
      <i class="ph ph-trash" aria-hidden="true"></i> Excluir
    </button>
  `;

  btn.setAttribute("aria-expanded", "true");
  btn.parentElement.appendChild(dropdown);

  const close = () => {
    dropdown.remove();
    btn.setAttribute("aria-expanded", "false");
  };

  dropdown
    .querySelector('[data-action="edit"]')
    .addEventListener("click", () => {
      close();
      openClienteModal({ id, cliente, container });
    });

  dropdown
    .querySelector('[data-action="delete"]')
    .addEventListener("click", () => {
      close();
      openConfirmModal({
        title: "Excluir cliente",
        message: `Tem certeza que deseja excluir <strong>${cliente.nome}</strong>? Esta ação não pode ser desfeita.`,
        confirmLabel: "Excluir",
        onConfirm: async () => {
          try {
            await excluirCliente(id);
            showToast("Cliente excluído com sucesso.", "success");
          } catch {
            showToast("Erro ao excluir cliente.", "error");
          }
        },
      });
    });

  // Fechar ao clicar fora
  setTimeout(() => {
    document.addEventListener("click", close, { once: true });
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") close();
      },
      { once: true },
    );
  }, 0);
}

/**
 * Abre o modal de cadastro/edição de cliente.
 * @param {Object} [opts]
 */
function openClienteModal({ id = null, cliente = null, container } = {}) {
  const isEdit = !!id;
  const title = isEdit ? "Editar Cliente" : "Novo Cliente";

  const body = `
    <form id="form-cliente" novalidate aria-label="Formulário de cliente">
      <fieldset style="border:none;padding:0;display:contents">
        <legend class="sr-only">${title}</legend>
        <div class="form-grid">
          <div class="form-group form-grid--full">
            <label class="form-group__label" for="c-nome">Razão Social / Nome *</label>
            <input class="input" type="text" id="c-nome" name="nome" autocomplete="organization"
              value="${cliente?.nome || ""}" required aria-required="true" aria-describedby="err-nome"/>
            <span class="form-group__error" id="err-nome" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="c-cnpj">CNPJ / CPF</label>
            <input class="input" type="text" id="c-cnpj" name="cnpj" data-mask="cnpj"
              value="${cliente?.cnpj || ""}" aria-describedby="err-cnpj"/>
            <span class="form-group__error" id="err-cnpj" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="c-regime">Regime Tributário</label>
            <select class="input" id="c-regime" name="regime" aria-describedby="err-regime">
              <option value="">Selecione...</option>
              ${REGIMES.map((r) => `<option value="${r}" ${cliente?.regime === r ? "selected" : ""}>${r}</option>`).join("")}
            </select>
            <span class="form-group__error" id="err-regime" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="c-responsavel">Responsável</label>
            <input class="input" type="text" id="c-responsavel" name="responsavel" autocomplete="name"
              value="${cliente?.responsavel || ""}"/>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="c-tel">Telefone</label>
            <input class="input" type="tel" id="c-tel" name="tel" data-mask="telefone" autocomplete="tel"
              value="${cliente?.tel || ""}"/>
          </div>

          <div class="form-group form-grid--full">
            <label class="form-group__label" for="c-email">E-mail</label>
            <input class="input" type="email" id="c-email" name="email" autocomplete="email"
              value="${cliente?.email || ""}" aria-describedby="err-email"/>
            <span class="form-group__error" id="err-email" role="alert"></span>
          </div>

          <div class="form-group form-grid--full">
            <label class="form-group__label" for="c-obs">Observações</label>
            <textarea class="input" id="c-obs" name="obs" rows="3">${cliente?.obs || ""}</textarea>
          </div>
        </div>
      </fieldset>
    </form>
  `;

  const { close } = openModal({
    title,
    body,
    size: "lg",
    actions: [
      {
        label: "Cancelar",
        cls: "btn--secondary",
        action: ({ close }) => close(),
      },
      {
        label: isEdit ? "Salvar" : "Cadastrar",
        cls: "btn--primary",
        action: ({ close }) => submitCliente(close, id),
      },
    ],
  });

  // Aplica máscaras após renderizar
  setTimeout(() => {
    const form = document.getElementById("form-cliente");
    if (form) applyMasks(form);
  }, 50);
}

/**
 * Submete o formulário de cliente.
 * @param {function} close
 * @param {string|null} id
 */
async function submitCliente(close, id) {
  const form = document.getElementById("form-cliente");
  if (!form) return;

  // Limpa erros
  form
    .querySelectorAll(".form-group")
    .forEach((g) => g.classList.remove("form-group--invalid"));
  form
    .querySelectorAll(".form-group__error")
    .forEach((e) => (e.textContent = ""));

  const dados = {
    nome: form.elements["nome"].value.trim(),
    cnpj: form.elements["cnpj"].value.trim(),
    regime: form.elements["regime"].value,
    responsavel: form.elements["responsavel"].value.trim(),
    tel: form.elements["tel"].value.trim(),
    email: form.elements["email"].value.trim(),
    obs: form.elements["obs"].value.trim(),
  };

  // Validações
  let hasError = false;
  const setErr = (name, msg) => {
    const input = form.elements[name];
    const group = input?.closest(".form-group");
    const err = group?.querySelector(".form-group__error");
    if (group) group.classList.add("form-group--invalid");
    if (err) err.textContent = msg;
    hasError = true;
  };

  if (!required(dados.nome)) setErr("nome", "Nome é obrigatório.");
  if (dados.email && !validarEmail(dados.email))
    setErr("email", "E-mail inválido.");
  if (hasError) return;

  try {
    if (id) {
      await atualizarCliente(id, dados);
      showToast("Cliente atualizado com sucesso.", "success");
    } else {
      await criarCliente(dados);
      showToast("Cliente cadastrado com sucesso.", "success");
    }
    close();
  } catch {
    showToast("Erro ao salvar cliente.", "error");
  }
}

/**
 * Vincula eventos da página.
 * @param {HTMLElement} container
 */
function bindPageEvents(container) {
  container.querySelector("#btn-novo-cliente").addEventListener("click", () => {
    openClienteModal({ container });
  });

  container.querySelector("#clientes-busca").addEventListener("input", (e) => {
    filtro = e.target.value;
    renderCards(container);
  });
}
