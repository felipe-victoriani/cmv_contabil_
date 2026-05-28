/**
 * mask.utils.js — Máscaras de entrada
 */

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 * @param {string} value
 * @returns {string}
 */
export function maskCNPJ(value) {
  const v = value.replace(/\D/g, "").slice(0, 14);
  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/**
 * Aplica máscara de CPF: 000.000.000-00
 * @param {string} value
 * @returns {string}
 */
export function maskCPF(value) {
  const v = value.replace(/\D/g, "").slice(0, 11);
  return v
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/**
 * Aplica máscara de telefone: (00) 00000-0000 ou (00) 0000-0000
 * @param {string} value
 * @returns {string}
 */
export function maskTelefone(value) {
  const v = value.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 10) {
    return v.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return v.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

/**
 * Aplica máscara dinâmica a um input baseado no atributo data-mask.
 * @param {HTMLInputElement} input
 */
export function applyMask(input) {
  const mask = input.dataset.mask;
  if (!mask) return;

  input.addEventListener("input", () => {
    const raw = input.value;
    switch (mask) {
      case "cnpj":
        input.value = maskCNPJ(raw);
        break;
      case "cpf":
        input.value = maskCPF(raw);
        break;
      case "telefone":
        input.value = maskTelefone(raw);
        break;
    }
  });
}

/**
 * Aplica máscaras a todos os inputs com data-mask no container.
 * @param {HTMLElement} container
 */
export function applyMasks(container) {
  container.querySelectorAll("[data-mask]").forEach(applyMask);
}
