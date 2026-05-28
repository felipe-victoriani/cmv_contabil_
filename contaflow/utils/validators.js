/**
 * validators.js — Validações de formulário
 */

/**
 * Valida CNPJ (com dígitos verificadores).
 * @param {string} cnpj
 * @returns {boolean}
 */
export function validarCNPJ(cnpj) {
  const c = cnpj.replace(/\D/g, "");
  if (c.length !== 14) return false;
  if (/^(\d)\1+$/.test(c)) return false;

  const calc = (len) => {
    let sum = 0,
      pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(c.charAt(len - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return r === parseInt(c.charAt(len));
  };

  return calc(12) && calc(13);
}

/**
 * Valida CPF (com dígitos verificadores).
 * @param {string} cpf
 * @returns {boolean}
 */
export function validarCPF(cpf) {
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11) return false;
  if (/^(\d)\1+$/.test(c)) return false;

  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(c[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return (r === 10 || r === 11 ? 0 : r) === parseInt(c[len]);
  };

  return calc(9) && calc(10);
}

/**
 * Valida e-mail com regex simples.
 * @param {string} email
 * @returns {boolean}
 */
export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Verifica se o valor não está vazio.
 * @param {string} value
 * @returns {boolean}
 */
export function required(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

/**
 * Valida um formulário baseado em regras declarativas.
 * @param {HTMLFormElement} form
 * @param {Object} rules - { fieldName: [ {fn, msg} ] }
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateForm(form, rules) {
  const errors = {};
  let valid = true;

  for (const [name, fieldRules] of Object.entries(rules)) {
    const input = form.elements[name];
    if (!input) continue;
    const value = input.value;

    for (const rule of fieldRules) {
      if (!rule.fn(value)) {
        errors[name] = rule.msg;
        valid = false;
        break;
      }
    }
  }

  return { valid, errors };
}

/**
 * Exibe erros inline no formulário.
 * @param {HTMLFormElement} form
 * @param {Object} errors - { fieldName: mensagem }
 */
export function showFormErrors(form, errors) {
  // Limpa erros anteriores
  form.querySelectorAll(".form-group").forEach((g) => {
    g.classList.remove("form-group--invalid");
    const err = g.querySelector(".form-group__error");
    if (err) err.textContent = "";
  });

  for (const [name, msg] of Object.entries(errors)) {
    const input = form.elements[name];
    if (!input) continue;
    const group = input.closest(".form-group");
    if (!group) continue;
    group.classList.add("form-group--invalid");
    const err = group.querySelector(".form-group__error");
    if (err) err.textContent = msg;
  }
}

/**
 * Limpa erros inline do formulário.
 * @param {HTMLFormElement} form
 */
export function clearFormErrors(form) {
  form.querySelectorAll(".form-group").forEach((g) => {
    g.classList.remove("form-group--invalid");
    const err = g.querySelector(".form-group__error");
    if (err) err.textContent = "";
  });
}
