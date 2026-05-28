/**
 * icon.js — Helper para renderizar ícones Phosphor
 */

/**
 * Retorna o HTML de um ícone Phosphor.
 * @param {string} name - Nome do ícone (ex: 'user', 'trash', 'plus')
 * @param {Object} [opts]
 * @param {string} [opts.size='20'] - Tamanho em px
 * @param {string} [opts.weight='regular'] - Peso: thin|light|regular|bold|fill|duotone
 * @param {string} [opts.cls=''] - Classes adicionais
 * @returns {string} HTML string
 */
export function icon(name, { size = "20", weight = "regular", cls = "" } = {}) {
  return `<i class="ph${weight !== "regular" ? `-${weight}` : ""} ph-${name}${cls ? ` ${cls}` : ""}" style="font-size:${size}px" aria-hidden="true"></i>`;
}
