/**
 * firebase.example.js — Template de configuração do Firebase
 *
 * INSTRUÇÕES:
 * 1. Copie este arquivo como config/firebase.js
 * 2. Preencha com as credenciais do seu projeto Firebase
 * 3. NUNCA commite firebase.js com credenciais reais (está no .gitignore)
 *
 * Onde encontrar as credenciais:
 * Firebase Console → Configurações do Projeto → Seus aplicativos → SDK snippet
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
