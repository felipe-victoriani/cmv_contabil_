/**
 * modal.js — Modal global reutilizável
 */

/** @type {HTMLElement|null} */
let modalRoot = null;
/** @type {HTMLElement|null} */
let lastFocusedElement = null;

/**
 * Abre um modal com conteúdo dinâmico.
 * @param {Object} opts
 * @param {string} opts.title - Título do modal
 * @param {string} opts.body  - HTML do corpo do modal
 * @param {Array<{label: string, cls: string, action: function}>} [opts.actions] - Botões do footer
 * @param {string} [opts.size='md'] - Tamanho: sm|md|lg
 * @returns {{ close: function }} Objeto com método close
 */
export function openModal({ title, body, actions = [], size = "md" }) {
  modalRoot = document.getElementById("modal-root");
  lastFocusedElement = document.activeElement;

  const actionsHTML = actions
    .map(
      (a, i) =>
        `<button class="btn ${a.cls}" data-action="${i}" type="button">${a.label}</button>`,
    )
    .join("");

  modalRoot.innerHTML = `
    <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal modal--${size}">
        <header class="modal__header">
          <h2 class="modal__title" id="modal-title">${title}</h2>
          <button class="modal__close btn btn--ghost btn--sm" aria-label="Fechar modal">
            <i class="ph ph-x" aria-hidden="true"></i>
          </button>
        </header>
        <div class="modal__body">${body}</div>
        ${actionsHTML ? `<footer class="modal__footer">${actionsHTML}</footer>` : ""}
      </div>
    </div>
  `;

  const overlay = modalRoot.querySelector(".modal-overlay");
  const modal = modalRoot.querySelector(".modal");

  const close = () => {
    overlay.classList.add("modal-overlay--exiting");
    modal.classList.add("modal--exiting");
    setTimeout(() => {
      modalRoot.innerHTML = "";
      lastFocusedElement?.focus();
    }, 200);
  };

  // Fecha ao clicar no overlay
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  // Fecha com Escape
  const onKeydown = (e) => {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", onKeydown);
    }
    // Trap focus dentro do modal
    if (e.key === "Tab") {
      const focusables = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (
        e.shiftKey
          ? document.activeElement === first
          : document.activeElement === last
      ) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }
  };
  document.addEventListener("keydown", onKeydown);

  // Botão de fechar
  overlay.querySelector(".modal__close").addEventListener("click", () => {
    close();
    document.removeEventListener("keydown", onKeydown);
  });

  // Botões de ação
  actions.forEach((a, i) => {
    overlay
      .querySelector(`[data-action="${i}"]`)
      .addEventListener("click", () => {
        a.action({ close });
      });
  });

  // Foco no primeiro elemento focável
  setTimeout(() => {
    const first = modal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    first?.focus();
  }, 50);

  return { close };
}

/**
 * Abre um modal de confirmação para ações destrutivas.
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.confirmLabel='Confirmar']
 * @param {function} opts.onConfirm
 */
export function openConfirmModal({
  title,
  message,
  confirmLabel = "Confirmar",
  onConfirm,
}) {
  openModal({
    title,
    size: "sm",
    body: `<p>${message}</p>`,
    actions: [
      {
        label: "Cancelar",
        cls: "btn--secondary",
        action: ({ close }) => close(),
      },
      {
        label: confirmLabel,
        cls: "btn--danger",
        action: ({ close }) => {
          close();
          onConfirm();
        },
      },
    ],
  });
}
