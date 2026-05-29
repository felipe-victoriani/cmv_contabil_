/**
 * topbar.js — Barra de navegação superior
 */
import { logout } from "../../services/auth.service.js";
import { navigate } from "../../router/router.js";
import { showToast } from "../toast/toast.js";
import { injectCSS, removeCSS } from "../../utils/css.utils.js";

const CSS_ID = "css-topbar";

const NAV_ITEMS = [
  { hash: "#/home", label: "Home", icon: "house" },
  { hash: "#/clientes", label: "Clientes", icon: "users" },
  { hash: "#/kanban", label: "Tarefas", icon: "kanban" },
  { hash: "#/prazos", label: "Prazos", icon: "calendar" },
  { hash: "#/documentos", label: "Documentos", icon: "file-text" },
];

/**
 * Monta a topbar no container.
 * @param {import('firebase/auth').User} user
 */
export async function mount(user) {
  await injectCSS("components/topbar/topbar.css", CSS_ID);
  const root = document.getElementById("topbar-root");
  if (!root) return;

  const initial = (user.email || "U")[0].toUpperCase();

  root.innerHTML = `
    <header class="topbar" role="banner">
      <div class="topbar__brand">
        <button class="topbar__hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="topbar-nav">
          <i class="ph ph-list" aria-hidden="true"></i>
        </button>
        <a href="#/home" class="topbar__logo" aria-label="CMV Contabilidade — ir para início">
          <i class="ph-bold ph-ledger" aria-hidden="true"></i>
          <span>CMV Contabilidade</span>
        </a>
      </div>

      <nav class="topbar__nav" id="topbar-nav" role="navigation" aria-label="Navegação principal">
        <ul class="topbar__nav-list" role="list">
          ${NAV_ITEMS.map(
            (item) => `
            <li>
              <a href="${item.hash}"
                 class="topbar__nav-link"
                 data-hash="${item.hash}"
                 aria-current="false">
                <i class="ph ph-${item.icon}" aria-hidden="true"></i>
                <span>${item.label}</span>
              </a>
            </li>
          `,
          ).join("")}
        </ul>
      </nav>

      <div class="topbar__actions">
        <div class="topbar__user" role="group" aria-label="Menu do usuário">
          <div class="topbar__avatar" aria-hidden="true">${initial}</div>
          <span class="topbar__email">${user.email}</span>
          <button class="topbar__logout btn btn--ghost btn--sm" aria-label="Sair da conta">
            <i class="ph ph-sign-out" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </header>

    <div class="topbar__overlay" id="topbar-overlay" aria-hidden="true"></div>
  `;

  bindEvents(root);
  updateActive();
}

/**
 * Desmonta a topbar.
 */
export function unmount() {
  const root = document.getElementById("topbar-root");
  if (root) root.innerHTML = "";
  removeCSS(CSS_ID);
}

/**
 * Vincula eventos da topbar.
 * @param {HTMLElement} root
 */
function bindEvents(root) {
  // Logout
  root.querySelector(".topbar__logout").addEventListener("click", async () => {
    try {
      await logout();
    } catch (e) {
      showToast("Erro ao sair. Tente novamente.", "error");
    }
  });

  // Hamburger
  const hamburger = root.querySelector(".topbar__hamburger");
  const nav = root.querySelector(".topbar__nav");
  const overlay = root.querySelector(".topbar__overlay");

  const openMenu = () => {
    nav.classList.add("topbar__nav--open");
    overlay.classList.add("topbar__overlay--visible");
    hamburger.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    nav.classList.remove("topbar__nav--open");
    overlay.classList.remove("topbar__overlay--visible");
    hamburger.setAttribute("aria-expanded", "false");
  };

  hamburger.addEventListener("click", () => {
    const isOpen = nav.classList.contains("topbar__nav--open");
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);

  // Fechar menu ao navegar
  root.querySelectorAll(".topbar__nav-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Atualiza link ativo ao mudar hash
  window.addEventListener("hashchange", updateActive);
}

/**
 * Marca o link de navegação ativo de acordo com o hash atual.
 */
function updateActive() {
  let hash = window.location.hash || "#/home";
  // Trata raiz como home
  if (hash === "#/" || hash === "#") hash = "#/home";
  document.querySelectorAll(".topbar__nav-link").forEach((link) => {
    const active = link.dataset.hash === hash;
    link.classList.toggle("topbar__nav-link--active", active);
    link.setAttribute("aria-current", active ? "page" : "false");
  });
}

/**
 * Atualiza o badge de alertas no link de Prazos.
 * @param {number} count - Quantidade de prazos urgentes/vencidos não concluídos
 */
export function updatePrazosAlert(count) {
  const link = document.querySelector(
    '.topbar__nav-link[data-hash="#/prazos"]',
  );
  if (!link) return;

  let badge = link.querySelector(".topbar__badge");

  if (count <= 0) {
    badge?.remove();
    return;
  }

  if (!badge) {
    badge = document.createElement("span");
    badge.className = "topbar__badge";
    badge.setAttribute(
      "aria-label",
      `${count} prazo${count > 1 ? "s" : ""} urgente${count > 1 ? "s" : ""}`,
    );
    link.appendChild(badge);
  }

  badge.textContent = count > 9 ? "9+" : String(count);
}
