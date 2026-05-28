/**
 * app.store.js — Estado global reativo (Observer pattern)
 */

/** @type {Object} Estado da aplicação */
const state = {
  clientes: {},
  tarefas: {},
  prazos: {},
  documentos: {},
  usuarios: {},
  user: null,
};

/** @type {Object.<string, Set<function>>} Mapa de listeners por chave */
const listeners = {};

/**
 * Inscreve uma função para mudanças em uma chave do estado.
 * @param {string} key - Chave do estado
 * @param {function} fn - Função chamada com o novo valor
 * @returns {function} Função de cancelamento da inscrição
 */
export function subscribe(key, fn) {
  if (!listeners[key]) listeners[key] = new Set();
  listeners[key].add(fn);
  return () => listeners[key].delete(fn);
}

/**
 * Atualiza uma chave do estado e notifica os inscritos.
 * @param {string} key
 * @param {*} value
 */
export function setState(key, value) {
  state[key] = value;
  listeners[key]?.forEach((fn) => fn(value));
}

/**
 * Retorna o valor atual de uma chave do estado.
 * @param {string} key
 * @returns {*}
 */
export function getState(key) {
  return state[key];
}
