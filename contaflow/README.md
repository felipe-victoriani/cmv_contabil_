# CMV Contabilidade

Sistema de gestão para escritório de contabilidade — **clientes, tarefas (Kanban), prazos fiscais e documentos** — em SPA HTML/CSS/JS puro com Firebase Realtime Database.

---

## Requisitos

- Navegador moderno (Chrome 90+, Firefox 90+, Edge 90+)
- Conta no [Firebase](https://firebase.google.com) (gratuita)
- Servidor HTTP local para servir os arquivos (devido ao uso de ES Modules)

---

## Configuração do Firebase

### 1. Criar projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **Adicionar projeto**
3. Siga o assistente e crie o projeto

### 2. Habilitar autenticação por e-mail/senha

1. No menu lateral, vá em **Authentication → Sign-in method**
2. Clique em **E-mail/senha** e ative
3. Crie um usuário em **Authentication → Users → Adicionar usuário**

### 3. Habilitar Realtime Database

1. No menu lateral, vá em **Realtime Database**
2. Clique em **Criar banco de dados**
3. Escolha a região mais próxima (ex: `us-central1`)
4. Inicie no **modo de teste** (você vai alterar as regras a seguir)

### 4. Configurar regras de segurança

No Realtime Database → **Regras**, substitua o conteúdo por:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

Clique em **Publicar**.

### 5. Obter as credenciais do projeto

1. Vá em **Configurações do projeto** (ícone de engrenagem)
2. Role até **Seus apps** e clique em **</>** (Web)
3. Registre o app e copie o objeto `firebaseConfig`

### 6. Inserir credenciais no projeto

Abra o arquivo `config/firebase.js` e substitua os valores do objeto `firebaseConfig`:

```js
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};
```

---

## Como executar

O projeto usa **ES Modules** (`type="module"`), portanto **não pode ser aberto como `file://`**. Use um servidor HTTP local:

### Opção 1 — VS Code Live Server

Instale a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) e clique em **Go Live** na barra inferior.

### Opção 2 — Python (built-in)

```bash
# Python 3
python -m http.server 5500
```

Acesse: `http://localhost:5500`

### Opção 3 — Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Public directory: .  (raiz do projeto)
# Configure as SPA: sim
firebase deploy
```

### Opção 4 — Netlify / Vercel

Arraste a pasta `contaflow/` para [netlify.com/drop](https://netlify.com/drop) ou importe no Vercel.

---

## Estrutura de pastas

```
contaflow/
├── index.html                  # Shell SPA (único HTML)
├── main.js                     # Entrada: router + guard de autenticação
├── config/
│   └── firebase.js             # Inicialização do Firebase SDK
├── styles/
│   ├── reset.css
│   ├── tokens.css              # Design tokens (cores, espaçamento, etc.)
│   ├── typography.css
│   ├── animations.css
│   └── global.css              # Componentes base (btn, input, card, etc.)
├── utils/
│   ├── date.utils.js           # Formatação e cálculo de datas
│   ├── mask.utils.js           # Máscaras CNPJ, CPF, Telefone
│   ├── validators.js           # Validações de formulário
│   └── css.utils.js            # injectCSS / removeCSS
├── store/
│   └── app.store.js            # Estado global (padrão Observer)
├── router/
│   └── router.js               # Roteador hash-based SPA
├── services/
│   ├── auth.service.js
│   ├── clientes.service.js
│   ├── tarefas.service.js
│   ├── prazos.service.js
│   └── documentos.service.js
├── components/
│   ├── icon/icon.js            # Helper de ícones Phosphor
│   ├── toast/                  # Notificações toast
│   ├── modal/                  # Modal genérico + modal de confirmação
│   └── topbar/                 # Barra de navegação principal
└── pages/
    ├── login/
    ├── clientes/
    ├── kanban/
    ├── prazos/
    └── documentos/
```

---

## Rotas

| Rota           | Página                   |
| -------------- | ------------------------ |
| `#/login`      | Login                    |
| `#/clientes`   | Gestão de Clientes       |
| `#/kanban`     | Quadro Kanban de Tarefas |
| `#/prazos`     | Prazos Fiscais           |
| `#/documentos` | Controle de Documentos   |

---

## Tecnologias

- **HTML5 + CSS3 + JavaScript ES6+** — sem build, sem npm, sem frameworks
- **Firebase v10** (CDN) — Auth + Realtime Database
- **Phosphor Icons** (CDN)
- **Google Fonts** — DM Serif Display + DM Sans
