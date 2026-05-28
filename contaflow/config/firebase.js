/**
 * firebase.js — Inicialização do Firebase
 * Substitua os valores de firebaseConfig com os do seu projeto Firebase.
 * NUNCA commite este arquivo com credenciais reais em repositórios públicos.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbZzMZHp5SLpT1_OCqMjzl8lHWmRGnOVQ",
  authDomain: "cmv-contabilidade.firebaseapp.com",
  databaseURL: "https://cmv-contabilidade-default-rtdb.firebaseio.com",
  projectId: "cmv-contabilidade",
  storageBucket: "cmv-contabilidade.firebasestorage.app",
  messagingSenderId: "776591659932",
  appId: "1:776591659932:web:f125476803e3515deeee59",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
