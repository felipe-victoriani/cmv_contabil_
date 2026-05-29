/**
 * main.js — Entry point da aplicação CMV Contabilidade
 */
import { setState } from "./store/app.store.js";
import { register, navigate, resolveRoute } from "./router/router.js";
import { watchAuthState } from "./services/auth.service.js";
import { watchPrazos } from "./services/prazos.service.js";
import { watchTarefas } from "./services/tarefas.service.js";
import { watchClientes } from "./services/clientes.service.js";
import { watchDocumentos } from "./services/documentos.service.js";
import {
  mount as mountTopbar,
  unmount as unmountTopbar,
  updatePrazosAlert,
} from "./components/topbar/topbar.js";
import { initToast, showToast } from "./components/toast/toast.js";
import { diasRestantes } from "./utils/date.utils.js";

// Pages
import * as LoginPage from "./pages/login/login.js";
import * as HomePage from "./pages/home/home.js";
import * as ClientesPage from "./pages/clientes/clientes.js";
import * as KanbanPage from "./pages/kanban/kanban.js";
import * as PrazosPage from "./pages/prazos/prazos.js";
import * as DocumentosPage from "./pages/documentos/documentos.js";

// Inicializa toast global
initToast();

/** @type {function|null} */ let unsubPrazosAlert = null;
/** @type {function|null} */ let unsubTarefasGlobal = null;
/** @type {function|null} */ let unsubClientesGlobal = null;
/** @type {function|null} */ let unsubDocumentosGlobal = null;

/**
 * Inicia a assinatura de prazos para o sistema de alertas.
 * Exibe badge na topbar e toast na primeira vez da sessão.
 */
function startPrazosAlert() {
  unsubPrazosAlert?.();
  unsubPrazosAlert = watchPrazos((prazos) => {
    setState("prazos", prazos);
    const urgentes = Object.values(prazos).filter((p) => {
      if (p.done) return false;
      const dias = diasRestantes(p.vencimento);
      return dias !== null && dias <= 3;
    });

    updatePrazosAlert(urgentes.length);

    // Toast de aviso — apenas uma vez por sessão
    if (
      urgentes.length > 0 &&
      !sessionStorage.getItem("prazos-alerta-exibido")
    ) {
      sessionStorage.setItem("prazos-alerta-exibido", "1");
      const vencidos = urgentes.filter(
        (p) => diasRestantes(p.vencimento) < 0,
      ).length;
      const msg =
        vencidos > 0
          ? `⚠️ ${vencidos} prazo${vencidos > 1 ? "s" : ""} vencido${vencidos > 1 ? "s" : ""}! Acesse Prazos.`
          : `⚠️ ${urgentes.length} prazo${urgentes.length > 1 ? "s" : ""} vencendo em até 3 dias.`;
      showToast(msg, "warning");
    }
  });
}

function stopPrazosAlert() {
  unsubPrazosAlert?.();
  unsubPrazosAlert = null;
  updatePrazosAlert(0);
}

/** Inicia watchers globais que populam o store para todas as coleções. */
function startGlobalWatchers() {
  unsubTarefasGlobal?.();
  unsubClientesGlobal?.();
  unsubDocumentosGlobal?.();
  unsubTarefasGlobal = watchTarefas((data) => setState("tarefas", data));
  unsubClientesGlobal = watchClientes((data) => setState("clientes", data));
  unsubDocumentosGlobal = watchDocumentos((data) =>
    setState("documentos", data),
  );
}

/** Para watchers globais ao sair. */
function stopGlobalWatchers() {
  unsubTarefasGlobal?.();
  unsubClientesGlobal?.();
  unsubDocumentosGlobal?.();
  unsubTarefasGlobal = unsubClientesGlobal = unsubDocumentosGlobal = null;
  setState("tarefas", {});
  setState("clientes", {});
  setState("documentos", {});
  setState("prazos", {});
}

// Registra rotas
register("#/login", LoginPage);
register("#/", HomePage);
register("#/home", HomePage);
register("#/clientes", ClientesPage);
register("#/kanban", KanbanPage);
register("#/prazos", PrazosPage);
register("#/documentos", DocumentosPage);

// Guard de autenticação — watchAuthState já chama syncUsuario ao detectar login
watchAuthState(async (user) => {
  setState("user", user);

  const hash = window.location.hash || "#/clientes";

  if (user) {
    await mountTopbar(user);
    startGlobalWatchers();
    startPrazosAlert();
    if (hash === "#/login") navigate("#/home");
    else resolveRoute();
  } else {
    stopGlobalWatchers();
    stopPrazosAlert();
    unmountTopbar();
    navigate("#/login");
  }
});
