/**
 * date.utils.js — Utilitários de data
 */

/**
 * Formata timestamp ou string de data para o padrão brasileiro dd/mm/aaaa.
 * @param {number|string} value - Timestamp em ms ou string YYYY-MM-DD
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return "—";
  const d =
    typeof value === "number" ? new Date(value) : new Date(`${value}T00:00:00`);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

/**
 * Formata YYYY-MM para "Mês/Ano" ex: "janeiro/2024".
 * @param {string} competencia - Formato YYYY-MM
 * @returns {string}
 */
export function formatCompetencia(competencia) {
  if (!competencia) return "—";
  const [year, month] = competencia.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/**
 * Retorna a diferença em dias entre hoje e uma data YYYY-MM-DD.
 * Negativo = vencido. Positivo = dias restantes.
 * @param {string} dateStr - Formato YYYY-MM-DD
 * @returns {number}
 */
export function diasRestantes(dateStr) {
  if (!dateStr) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${dateStr}T00:00:00`);
  return Math.round((alvo - hoje) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna a classe de urgência para um prazo.
 * @param {string} dateStr - Formato YYYY-MM-DD
 * @param {boolean} done
 * @returns {'ok'|'warning'|'danger'|'done'}
 */
export function urgenciaClass(dateStr, done) {
  if (done) return "done";
  const diff = diasRestantes(dateStr);
  if (diff === null) return "ok";
  if (diff < 0) return "danger";
  if (diff <= 3) return "warning";
  return "ok";
}

/**
 * Retorna o mês e ano atual no formato YYYY-MM.
 * @returns {string}
 */
export function mesAtual() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Avança ou recua mês.
 * @param {string} ym - Formato YYYY-MM
 * @param {number} delta - +1 ou -1
 * @returns {string}
 */
export function deslocarMes(ym, delta) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const ny = d.getFullYear();
  const nm = String(d.getMonth() + 1).padStart(2, "0");
  return `${ny}-${nm}`;
}

/**
 * Formata YYYY-MM para nome do mês + ano.
 * @param {string} ym
 * @returns {string}
 */
export function nomesMes(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
