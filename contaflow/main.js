/**
 * main.js — Entry point da aplicação CMV Contabilidade
 */
import { setState } from "./store/app.store.js";
import { register, navigate, resolveRoute } from "./router/router.js";
import { watchAuthState } from "./services/auth.service.js";
import {
  mount as mountTopbar,
  unmount as unmountTopbar,
} from "./components/topbar/topbar.js";
import { initToast } from "./components/toast/toast.js";

// Pages
import * as LoginPage from "./pages/login/login.js";
import * as ClientesPage from "./pages/clientes/clientes.js";
import * as KanbanPage from "./pages/kanban/kanban.js";
import * as PrazosPage from "./pages/prazos/prazos.js";
import * as DocumentosPage from "./pages/documentos/documentos.js";

// Inicializa toast global
initToast();

// Registra rotas
register("#/login", LoginPage);
register("#/clientes", ClientesPage);
register("#/kanban", KanbanPage);
register("#/prazos", PrazosPage);
register("#/documentos", DocumentosPage);

// Guard de autenticação — watchAuthState já chama syncUsuario ao detectar login
watchAuthState((user) => {
  setState("user", user);

  const hash = window.location.hash || "#/clientes";

  if (user) {
    mountTopbar(user);
    if (hash === "#/login") navigate("#/clientes");
    else resolveRoute();
  } else {
    unmountTopbar();
    navigate("#/login");
  }
});
