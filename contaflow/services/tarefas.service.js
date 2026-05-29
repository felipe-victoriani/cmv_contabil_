/**
 * tarefas.service.js — CRUD de tarefas no Firebase Realtime Database
 */
import { db } from "../config/firebase.js";
import {
  ref,
  push,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const PATH = "tarefas";

/**
 * Observa todas as tarefas em tempo real.
 * @param {function} callback - Chamado com objeto { id: dados }
 * @returns {function} Unsubscribe
 */
export function watchTarefas(callback) {
  const r = ref(db, PATH);
  return onValue(r, (snap) => callback(snap.val() || {}));
}

/**
 * Cria uma nova tarefa.
 * @param {Object} dados
 * @returns {Promise}
 */
export async function criarTarefa(dados) {
  return push(ref(db, PATH), {
    ...dados,
    criadoEm: Date.now(),
  });
}

/**
 * Atualiza uma tarefa existente.
 * @param {string} id
 * @param {Object} dados
 * @returns {Promise}
 */
export async function atualizarTarefa(id, dados) {
  return update(ref(db, `${PATH}/${id}`), dados);
}

/**
 * Exclui uma tarefa pelo ID.
 * @param {string} id
 * @returns {Promise}
 */
export async function excluirTarefa(id) {
  return remove(ref(db, `${PATH}/${id}`));
}

/**
 * Avança o status de uma tarefa para o próximo estágio.
 * @param {string} id
 * @param {string} statusAtual
 * @returns {Promise}
 */
export async function avancarStatus(id, statusAtual) {
  const ORDEM = ["todo", "doing", "waiting", "done"];
  const idx = ORDEM.indexOf(statusAtual);
  if (idx === -1 || idx === ORDEM.length - 1) return;
  return atualizarTarefa(id, {
    status: ORDEM[idx + 1],
    atualizadoEm: Date.now(),
  });
}
