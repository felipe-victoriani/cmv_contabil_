/**
 * auth.service.js — Serviço de autenticação Firebase
 */
import { auth } from "../config/firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { syncUsuario } from "./usuarios.service.js";

/**
 * Realiza login com e-mail e senha.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function login(email, password) {
  await setPersistence(auth, browserLocalPersistence);
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Realiza logout do usuário atual.
 * @returns {Promise<void>}
 */
export async function logout() {
  return signOut(auth);
}

/**
 * Observa mudanças no estado de autenticação.
 * Ao detectar um usuário logado, sincroniza o perfil no banco de dados.
 * @param {function} callback - Chamado com o usuário ou null
 * @returns {function} Unsubscribe
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) syncUsuario(user);
    callback(user);
  });
}
