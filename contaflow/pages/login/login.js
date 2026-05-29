/**
 * login.js — Página de Login
 */
import { login } from "../../services/auth.service.js";
import { showToast } from "../../components/toast/toast.js";
import { injectCSS, removeCSS } from "../../utils/css.utils.js";
import {
  required,
  validarEmail,
  showFormErrors,
  clearFormErrors,
} from "../../utils/validators.js";

const CSS_ID = "css-login";

/**
 * Monta a página de login.
 * @param {HTMLElement} container
 */
export async function mount(container) {
  await injectCSS("pages/login/login.css", CSS_ID);
  container.innerHTML = template();
  bindEvents(container);
}

/** Remove a página de login. */
export function unmount() {}

/** @returns {string} HTML da página */
function template() {
  return `
    <div class="login">
      <div class="login__card">

        <img class="login__banner" src="images/logo_cmv.jpeg" alt="CMV Contabilidade">

        <div class="login__body">
          <div class="login__header">
            <h1 class="login__title">Bem-vindo</h1>
            <p class="login__subtitle">Acesse o sistema com suas credenciais</p>
          </div>

          <form class="login__form" id="login-form" novalidate aria-label="Formulário de login">
            <fieldset class="login__fieldset">
              <legend class="sr-only">Credenciais de acesso</legend>

              <div class="form-group" id="group-email">
                <label class="form-group__label" for="login-email">E-mail</label>
                <input
                  class="input"
                  type="email"
                  id="login-email"
                  name="email"
                  autocomplete="email"
                  placeholder="seu@email.com"
                  required
                  aria-required="true"
                  aria-describedby="error-email"
                />
                <span class="form-group__error" id="error-email" role="alert"></span>
              </div>

              <div class="form-group" id="group-password">
                <label class="form-group__label" for="login-password">Senha</label>
                <div class="login__input-wrap">
                  <input
                    class="input"
                    type="password"
                    id="login-password"
                    name="password"
                    autocomplete="current-password"
                    placeholder="••••••••"
                    required
                    aria-required="true"
                    aria-describedby="error-password"
                  />
                  <button type="button" class="login__toggle-pass" aria-label="Mostrar senha">
                    <i class="ph ph-eye" aria-hidden="true"></i>
                  </button>
                </div>
                <span class="form-group__error" id="error-password" role="alert"></span>
              </div>
            </fieldset>

            <button type="submit" class="btn btn--primary btn--lg login__submit" id="login-btn">
              Entrar
            </button>
          </form>

          <p class="login__footer">CMV Contabilidade &copy; ${new Date().getFullYear()}</p>
        </div>

      </div>
    </div>
  `;
}

/**
 * Vincula eventos da página de login.
 * @param {HTMLElement} container
 */
function bindEvents(container) {
  const form = container.querySelector("#login-form");
  const btn = container.querySelector("#login-btn");
  const togglePass = container.querySelector(".login__toggle-pass");
  const passInput = container.querySelector("#login-password");

  // Toggle visibilidade da senha
  togglePass.addEventListener("click", () => {
    const isText = passInput.type === "text";
    passInput.type = isText ? "password" : "text";
    togglePass.querySelector("i").className =
      `ph ph-${isText ? "eye" : "eye-slash"}`;
    togglePass.setAttribute(
      "aria-label",
      isText ? "Mostrar senha" : "Ocultar senha",
    );
  });

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const email = form.elements["email"].value.trim();
    const password = form.elements["password"].value;

    const errors = {};
    if (!required(email)) errors.email = "E-mail é obrigatório.";
    else if (!validarEmail(email)) errors.email = "Informe um e-mail válido.";
    if (!required(password)) errors.password = "Senha é obrigatória.";

    if (Object.keys(errors).length) {
      showFormErrors(form, errors);
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Entrando...';

    try {
      await login(email, password);
      // Redirecionamento gerenciado pelo onAuthStateChanged no main.js
    } catch (err) {
      let msg = "Erro ao fazer login. Tente novamente.";
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        msg = "E-mail ou senha incorretos.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Muitas tentativas. Aguarde alguns minutos.";
      }
      showToast(msg, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = "Entrar";
    }
  });

  // Validação inline ao sair do campo
  form.elements["email"].addEventListener("blur", function () {
    const v = this.value.trim();
    const group = container.querySelector("#group-email");
    const err = container.querySelector("#error-email");
    if (!required(v)) {
      group.classList.add("form-group--invalid");
      err.textContent = "E-mail é obrigatório.";
    } else if (!validarEmail(v)) {
      group.classList.add("form-group--invalid");
      err.textContent = "Informe um e-mail válido.";
    } else {
      group.classList.remove("form-group--invalid");
      err.textContent = "";
    }
  });

  form.elements["password"].addEventListener("blur", function () {
    const group = container.querySelector("#group-password");
    const err = container.querySelector("#error-password");
    if (!required(this.value)) {
      group.classList.add("form-group--invalid");
      err.textContent = "Senha é obrigatória.";
    } else {
      group.classList.remove("form-group--invalid");
      err.textContent = "";
    }
  });
}
