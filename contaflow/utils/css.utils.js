/**
 * css.utils.js — Injeção dinâmica de CSS por página
 */

/**
 * Injeta uma folha de estilo no documento se ainda não existir.
 * @param {string} href - Caminho do arquivo CSS
 * @param {string} id   - ID único para o elemento link
 */
export function injectCSS(href, id) {
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Remove uma folha de estilo do documento pelo seu ID.
 * @param {string} id
 */
export function removeCSS(id) {
  document.getElementById(id)?.remove();
}
