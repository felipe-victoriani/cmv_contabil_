/**
 * documentos.service.js — CRUD de documentos no Firebase Realtime Database
 */
import { db } from "../config/firebase.js";
import {
  ref,
  push,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const PATH = "documentos";

/**
 * Observa todos os documentos em tempo real.
 * @param {function} callback - Chamado com objeto { id: dados }
 * @returns {function} Unsubscribe
 */
export function watchDocumentos(callback) {
  const r = ref(db, PATH);
  return onValue(r, (snap) => callback(snap.val() || {}));
}

/**
 * Cria um novo registro de documento.
 * @param {Object} dados
 * @returns {Promise}
 */
export async function criarDocumento(dados) {
  return push(ref(db, PATH), {
    ...dados,
    status: "pendente",
    criadoEm: Date.now(),
  });
}

/**
 * Atualiza um documento existente.
 * @param {string} id
 * @param {Object} dados
 * @returns {Promise}
 */
export async function atualizarDocumento(id, dados) {
  return update(ref(db, `${PATH}/${id}`), dados);
}

/**
 * Exclui um documento pelo ID.
 * @param {string} id
 * @returns {Promise}
 */
export async function excluirDocumento(id) {
  return remove(ref(db, `${PATH}/${id}`));
}

/**
 * Avança o status do documento para o próximo estágio.
 * @param {string} id
 * @param {string} statusAtual
 * @returns {Promise}
 */
export async function avancarStatusDocumento(id, statusAtual) {
  const ORDEM = ["pendente", "recebido", "conferido"];
  const idx = ORDEM.indexOf(statusAtual);
  if (idx === -1 || idx === ORDEM.length - 1) return;
  return atualizarDocumento(id, { status: ORDEM[idx + 1] });
}
