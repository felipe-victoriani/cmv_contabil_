/**
 * router.js — SPA Router baseado em hashchange
 */

/** @type {Object.<string, {mount: function, unmount: function}>} */
const routes = {};

/** @type {{mount: function, unmount: function}|null} */
let currentPage = null;

/** @returns {HTMLElement} */
const container = () => document.getElementById("page-root");

/**
 * Registra uma rota no router.
 * @param {string} hash - Ex: '#/clientes'
 * @param {{ mount: function, unmount: function }} page
 */
export function register(hash, page) {
  routes[hash] = page;
}

/**
 * Navega para um hash específico.
 * @param {string} hash - Ex: '#/clientes'
 */
export function navigate(hash) {
  window.location.hash = hash;
}

/**
 * Resolve a rota atual e monta a página correspondente.
 */
function resolve() {
  const hash = window.location.hash || "#/home";
  const page = routes[hash];

  if (!page) {
    navigate("#/home");
    return;
  }

  currentPage?.unmount?.();
  currentPage = page;
  page.mount(container());
}

window.addEventListener("hashchange", resolve);
window.addEventListener("DOMContentLoaded", resolve);

/** Força resolução da rota atual (útil após login). */
export function resolveRoute() {
  resolve();
}
