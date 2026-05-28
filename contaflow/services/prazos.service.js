/**
 * prazos.service.js — CRUD de prazos fiscais no Firebase Realtime Database
 */
import { db } from "../config/firebase.js";
import {
  ref,
  push,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const PATH = "prazos";

/**
 * Observa todos os prazos fiscais em tempo real.
 * @param {function} callback - Chamado com objeto { id: dados }
 * @returns {function} Unsubscribe
 */
export function watchPrazos(callback) {
  const r = ref(db, PATH);
  return onValue(r, (snap) => callback(snap.val() || {}));
}

/**
 * Cria um novo prazo fiscal.
 * @param {Object} dados
 * @returns {Promise}
 */
export async function criarPrazo(dados) {
  return push(ref(db, PATH), {
    ...dados,
    done: false,
    criadoEm: Date.now(),
  });
}

/**
 * Atualiza um prazo fiscal existente.
 * @param {string} id
 * @param {Object} dados
 * @returns {Promise}
 */
export async function atualizarPrazo(id, dados) {
  return update(ref(db, `${PATH}/${id}`), dados);
}

/**
 * Exclui um prazo fiscal pelo ID.
 * @param {string} id
 * @returns {Promise}
 */
export async function excluirPrazo(id) {
  return remove(ref(db, `${PATH}/${id}`));
}

/**
 * Alterna o estado done de um prazo.
 * @param {string} id
 * @param {boolean} done
 * @returns {Promise}
 */
export async function togglePrazo(id, done) {
  return atualizarPrazo(id, { done });
}
