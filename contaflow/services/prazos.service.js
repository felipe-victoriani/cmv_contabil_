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
  return atualizarPrazo(id, { done, atualizadoEm: Date.now() });
}

// ── Templates de Prazos Recorrentes ───────────────────────

const TMPL_PATH = "prazo_templates";

/**
 * Observa todos os templates em tempo real.
 * @param {function} callback
 * @returns {function} Unsubscribe
 */
export function watchTemplates(callback) {
  const r = ref(db, TMPL_PATH);
  return onValue(r, (snap) => callback(snap.val() || {}));
}

/**
 * Cria um novo template de prazo recorrente.
 * @param {Object} dados - { tipo, dia, clienteId, responsavelId, obs }
 * @returns {Promise}
 */
export async function criarTemplate(dados) {
  return push(ref(db, TMPL_PATH), {
    ...dados,
    ativo: true,
    criadoEm: Date.now(),
  });
}

/**
 * Exclui um template pelo ID.
 * @param {string} id
 * @returns {Promise}
 */
export async function excluirTemplate(id) {
  return remove(ref(db, `${TMPL_PATH}/${id}`));
}

/**
 * Gera automaticamente prazos para um mês (YYYY-MM) com base nos templates.
 * Ignora meses onde o prazo daquele template já existe (evita duplicatas).
 * @param {string} mes - Formato YYYY-MM
 * @returns {Promise<number>} Quantidade de prazos gerados
 */
export async function gerarDoTemplates(mes) {
  const [snapTmpl, snapPrazos] = await Promise.all([
    new Promise((res) => {
      const unsub = onValue(ref(db, TMPL_PATH), (s) => {
        unsub();
        res(s.val() || {});
      });
    }),
    new Promise((res) => {
      const unsub = onValue(ref(db, PATH), (s) => {
        unsub();
        res(s.val() || {});
      });
    }),
  ]);

  // Conjunto de chaves "templateId|YYYY-MM" já existentes
  const existentes = new Set(
    Object.values(snapPrazos)
      .filter((p) => p.templateId && p.data)
      .map((p) => `${p.templateId}|${p.data.slice(0, 7)}`),
  );

  const promises = [];
  for (const [tmplId, tmpl] of Object.entries(snapTmpl)) {
    if (!tmpl.ativo) continue;
    const chave = `${tmplId}|${mes}`;
    if (existentes.has(chave)) continue;

    // Calcula a data: YYYY-MM-DD ajustando dia para não ultrapassar o fim do mês
    const [y, m] = mes.split("-").map(Number);
    const ultimoDia = new Date(y, m, 0).getDate();
    const dia = Math.min(Number(tmpl.dia), ultimoDia);
    const data = `${mes}-${String(dia).padStart(2, "0")}`;

    promises.push(
      push(ref(db, PATH), {
        tipo: tmpl.tipo,
        data,
        clienteId: tmpl.clienteId || "",
        responsavelId: tmpl.responsavelId || "",
        obs: tmpl.obs || "",
        templateId: tmplId,
        done: false,
        criadoEm: Date.now(),
      }),
    );
  }

  await Promise.all(promises);
  return promises.length;
}
