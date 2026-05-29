/**
 * frases.utils.js — Frases humorísticas do universo contábil
 */

const FRASES = [
  // ── Leão e Receita Federal ──
  "O Leão não dorme. Mas a gente também não.",
  "A Receita Federal não aceita desculpas. Mas a gente aceita café.",
  "Todo mês o Leão mia. A gente é que paga o veterinário.",
  "Imposto de Renda: a única certeza além da morte.",
  "O Leão rugiu. O DARF foi emitido. O café esfriou.",

  // ── Prazos ──
  "Prazo é prazo. O cliente que não mandou o extrato que explique.",
  "Dia 20: o dia em que o contador envelhece mais rápido.",
  "O prazo não avisa. Mas a gente avisa o cliente. Várias vezes.",
  "Contador bom é contador que dorme depois do dia 20.",
  "O DARF não paga sozinho. Mas a gente tenta.",
  "Mais um mês, mais uma DARF. A vida é bela.",

  // ── Simples Nacional ──
  "Simples Nacional. Simples só no nome.",
  "Simples Nacional: nada é simples, mas é nacional.",
  "MEI: micro empreendedor, macro confusão.",

  // ── Documentos e clientes ──
  "O extrato bancário estava na pasta certa. Era a pasta errada.",
  "O cliente disse que enviou. A caixa de entrada discorda.",
  "NF emitida. Cliente satisfeito. Milagre documentado.",
  "Faltou um documento. Só um. O mais importante.",
  "O cliente guardou tudo em uma caixinha. A caixinha sumiu.",
  '"Eu guardo tudo no e-mail." — Todo cliente, toda vez.',

  // ── Débito e crédito ──
  "Se tiver dúvida, debita. Se piorar, credita.",
  "Débito na conta de despesas. Crédito na conta de paciência.",
  "A conta fecha. Sempre. De um jeito ou de outro.",
  "Partidas dobradas: o erro também entra em dobro.",

  // ── Cotidiano do escritório ──
  "Mais um dia de luta. O café já está pronto.",
  "SPED, eSocial, EFD... alguém aí pediu sopa de letrinhas?",
  "Burocracia é o nosso cardápio. Servimos o dia todo.",
  "O sistema da Receita caiu. Surpresa de ninguém.",
  "Contador não tem horário. Tem prazo.",
  "Aqui a gente transforma caos fiscal em planilha organizada.",
  "Mais um dia de fazer o Brasil funcionar nas entrelinhas.",
  "Reforma Tributária: porque a vida era simples demais.",

  // ── Motivacionais irônicas ──
  "Você está no controle. Pelo menos das obrigações acessórias.",
  "Hoje pode ser o dia em que tudo fecha no azul.",
  "Resiliência: a principal habilidade do contador brasileiro.",
  "Orgulho de quem entende CFOP de cor.",
  "Nenhum balancete foi maltratado na produção deste sistema.",
];

/**
 * Retorna uma frase aleatória do array.
 * Evita repetir a mesma frase duas vezes seguidas usando sessionStorage.
 * @returns {string}
 */
export function getFraseAleatoria() {
  const ultima = sessionStorage.getItem("cf_ultima_frase");

  let candidatas = FRASES;

  if (ultima !== null) {
    candidatas = FRASES.filter((_, i) => String(i) !== ultima);
  }

  // Garante pelo menos 1 candidata (caso array tenha só 1 frase)
  if (!candidatas.length) candidatas = FRASES;

  const indice = Math.floor(Math.random() * candidatas.length);
  const frase = candidatas[indice];

  const indiceOriginal = FRASES.indexOf(frase);
  sessionStorage.setItem("cf_ultima_frase", String(indiceOriginal));

  return `"${frase}"`;
}
