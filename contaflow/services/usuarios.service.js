/**
 * usuarios.service.js — Perfis de usuários no Firebase Realtime Database
 *
 * Estratégia: quando um usuário autentica, sincronizamos seu perfil em
 * `usuarios/{uid}`. Isso permite listar todos os usuários ativos para
 * delegação de tarefas e responsabilidade de prazos.
 */
import { db } from "../config/firebase.js";
import {
  ref,
  update,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const PATH = "usuarios";

/**
 * Sincroniza o perfil do usuário autenticado no banco.
 * Chamado automaticamente após login.
 * @param {import('firebase/auth').User} user
 * @returns {Promise}
 */
export function syncUsuario(user) {
  if (!user) return Promise.resolve();
  const nome =
    user.displayName ||
    user.email
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  return update(ref(db, `${PATH}/${user.uid}`), {
    uid: user.uid,
    nome,
    email: user.email,
    ativo: true,
  });
}

/**
 * Observa todos os usuários ativos em tempo real.
 * @param {function} callback - Chamado com objeto { uid: { uid, nome, email, ativo } }
 * @returns {function} Unsubscribe
 */
export function watchUsuarios(callback) {
  const r = ref(db, PATH);
  return onValue(r, (snap) => {
    const todos = snap.val() || {};
    const ativos = Object.fromEntries(
      Object.entries(todos).filter(([, u]) => u.ativo !== false),
    );
    callback(ativos);
  });
}
