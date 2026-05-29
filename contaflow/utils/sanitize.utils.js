/**
 * sanitize.utils.js — Prevenção de XSS
 *
 * Converte caracteres especiais HTML em entidades seguras.
 * Use em TODA string vinda do Firebase antes de inserir via innerHTML.
 *
 * @param {*} value - Valor a ser sanitizado (qualquer tipo)
 * @returns {string} String segura para uso em innerHTML
 */
export function sanitize(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
