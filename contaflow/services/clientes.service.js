/**
 * clientes.service.js — CRUD de clientes no Firebase Realtime Database
 */
import { db } from "../config/firebase.js";
import {
  ref,
  push,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const PATH = "clientes";

/**
 * Observa todos os clientes em tempo real.
 * @param {function} callback - Chamado com objeto { id: dados }
 * @returns {function} Unsubscribe
 */
export function watchClientes(callback) {
  const r = ref(db, PATH);
  return onValue(r, (snap) => callback(snap.val() || {}));
}

/**
 * Cria um novo cliente.
 * @param {Object} dados
 * @returns {Promise}
 */
export async function criarCliente(dados) {
  return push(ref(db, PATH), {
    ...dados,
    criadoEm: Date.now(),
  });
}

/**
 * Atualiza um cliente existente.
 * @param {string} id
 * @param {Object} dados
 * @returns {Promise}
 */
export async function atualizarCliente(id, dados) {
  return update(ref(db, `${PATH}/${id}`), dados);
}

/**
 * Exclui um cliente pelo ID.
 * @param {string} id
 * @returns {Promise}
 */
export async function excluirCliente(id) {
  return remove(ref(db, `${PATH}/${id}`));
}
