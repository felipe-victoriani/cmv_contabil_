/**
 * toast.js — Notificações toast globais
 */

/** @type {HTMLElement|null} */
let toastRoot = null;

/**
 * Inicializa o container de toasts.
 */
export function initToast() {
  toastRoot = document.getElementById("toast-root");
}

/**
 * Exibe uma notificação toast.
 * @param {string} message - Mensagem a exibir
 * @param {'success'|'error'|'warning'|'info'} [type='info']
 * @param {number} [duration=4000] - Duração em ms
 */
export function showToast(message, type = "info", duration = 4000) {
  if (!toastRoot) toastRoot = document.getElementById("toast-root");
  if (!toastRoot) return;

  const ICONS = {
    success: "check-circle",
    error: "x-circle",
    warning: "warning",
    info: "info",
  };

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <i class="ph ph-${ICONS[type]}" aria-hidden="true"></i>
    <span class="toast__msg">${message}</span>
    <button class="toast__close" aria-label="Fechar notificação">
      <i class="ph ph-x" aria-hidden="true"></i>
    </button>
  `;

  const dismiss = () => {
    toast.classList.add("toast--exiting");
    toast.addEventListener("animationend", () => toast.remove(), {
      once: true,
    });
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector(".toast__close").addEventListener("click", dismiss);
  toastRoot.appendChild(toast);

  setTimeout(dismiss, duration);
}
