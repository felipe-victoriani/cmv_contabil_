/**
 * css.utils.js — Injeção dinâmica de CSS por página
 */

/**
 * Injeta uma folha de estilo no documento se ainda não existir.
 * Retorna uma Promise que resolve quando o CSS estiver carregado,
 * evitando Flash of Unstyled Content (FOUC).
 * @param {string} href - Caminho do arquivo CSS
 * @param {string} id   - ID único para o elemento link
 * @returns {Promise<void>}
 */
export function injectCSS(href, id) {
  const existing = document.getElementById(id);
  if (existing) return Promise.resolve();

  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => resolve(); // resolve mesmo em erro para não travar a página
    document.head.appendChild(link);
  });
}

/**
 * Remove uma folha de estilo do documento pelo seu ID.
 * @param {string} id
 */
export function removeCSS(id) {
  document.getElementById(id)?.remove();
}
