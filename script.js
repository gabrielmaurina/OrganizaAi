// ---------------------------------------------
// Script completo: usa GIDs, busca CSV e mostra
// apenas a 1ª semana (somente linhas de horários)
// ---------------------------------------------

const spreadsheetId = "1lXXx1iX-ZfOhcQgYDWlXWPT1ka3jYsH7F9yLithiW_g"; // <--- substitua aqui
const gidMap = {
  'info1': '1485729345',
  'info2': '241378235',
  'info3': '682083785',
  'adm1':  '1355056294',
  'adm2':  '1215763087',
  'adm3':  '602930849',
  'plas1': '677967311',
  'plas3': '740217798'
};

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("turmaSelect");
  select.addEventListener("change", onTurmaChange);

  // opcional: carregar a primeira turma selecionada ao abrir
  // if (select.value) onTurmaChange();
});

function onTurmaChange() {
  const turma = document.getElementById("turmaSelect").value;
  if (!turma) {
    document.getElementById("gradeContainer").style.display = "none";
    return;
  }

  const gid = gidMap[turma];
  if (!gid) {
    console.error("GID não encontrado para", turma);
    return;
  }

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}&_=${Date.now()}`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Falha ao buscar CSV: " + res.status);
      return res.text();
    })
    .then(csvText => {
      const tabela = parseCSV(csvText);
      const semana = extrairPrimeiraSemana(tabela);
      atualizarTabela(semana);
    })
    .catch(err => {
      console.error("Erro ao carregar planilha:", err);
    });
}

/* ============================
   Parser CSV robusto (suporta campos entre ") 
   Retorna array de linhas -> array de colunas (strings)
   ============================ */
function parseCSV(text) {
  const rows = [];
  let i = 0;
  const len = text.length;
  let cur = "";
  let row = [];
  let inQuotes = false;

  while (i < len) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // se próximo também é ", essa é uma aspa escapada
        if (i + 1 < len && text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        cur += ch;
        i++;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (ch === ",") {
        row.push(cur);
        cur = "";
        i++;
        continue;
      } else if (ch === "\r") {
        // ignore
        i++;
        continue;
      } else if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
        i++;
        continue;
      } else {
        cur += ch;
        i++;
        continue;
      }
    }
  }

  // final
  if (cur !== "" || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }

  // trim em cada célula
  return rows.map(r => r.map(c => (c === undefined ? "" : c.trim())));
}

/* ============================
   Detecta primeira linha que contém horário
   (vários formatos: 7:30, 07:30, 07h30, 07:30 - 08:20, 7:30–8:20, etc.)
   Depois coleta as linhas seguintes que também parecem horários.
   Retorna apenas as colunas A..G (7 colunas).
   ============================ */
function extrairPrimeiraSemana(tabela) {
  if (!Array.isArray(tabela) || tabela.length === 0) return [];

  // regex que reconhece início de célula de horário
  const horaRegex = /^\s*(\d{1,2}[:h]\d{2})/i; // 7:30, 07:30, 07h30
  const horaRangeRegex = /^\s*(\d{1,2}[:h]\d{2}).{0,8}[-–]\s*(\d{1,2}[:h]\d{2})/i; // 07:30 - 08:20, 7:30–8:20
  const maxColunas = 7; // A..G
  const semana = [];

  let inicio = -1;
  for (let r = 0; r < tabela.length; r++) {
    const c0 = (tabela[r][0] || "").toString();
    // algumas vezes o horário pode estar na segunda coluna (caso A esteja vazia), então checar algumas primeiras colunas
    const firstFew = (tabela[r].slice(0, 3) || []).join(" ").toString();

    if (horaRegex.test(c0) || horaRangeRegex.test(c0) || horaRegex.test(firstFew)) {
      inicio = r;
      break;
    }
  }

  if (inicio === -1) {
    console.warn("Não encontrou linha inicial de horários. Tentando heurística alternativa...");

    // heurística alternativa: procurar por linha que tenha >= maxColunas não-vazias e pareça um cabeçalho de dias (SEGUNDA, TERÇA...)
    const diasPattern = /(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado)/i;
    for (let r = 0; r < tabela.length; r++) {
      const joined = (tabela[r].slice(0, 10) || []).join(" ");
      if (diasPattern.test(joined)) {
        inicio = r + 1; // próxima linha possivelmente é primeira de horários
        break;
      }
    }
    if (inicio === -1) {
      // se ainda não encontrou, volta tudo vazio
      console.error("Falha ao localizar início da grade.");
      return [];
    }
  }

  // a partir do início, coletar linhas que pareçam horários.
  for (let r = inicio; r < tabela.length; r++) {
    const linha = tabela[r];

    // se linha vazia completa -> fim
    if (linha.every(c => c === "")) break;

    const c0 = (linha[0] || "").toString();

    // se houver "almoço" -> fim da semana
    if (c0.toLowerCase().includes("almoço") || c0.toLowerCase().includes("almoco")) break;

    // aceitar linha enquanto primeiro campo pareça horário (ou enquanto existam pelo menos 2 colunas não vazias)
    if (horaRegex.test(c0) || horaRangeRegex.test(c0) || (linha.slice(0, maxColunas).some(cell => cell && cell.trim() !== ""))) {
      // construir array com exatamente maxColunas entradas
      const corte = [];
      for (let ci = 0; ci < maxColunas; ci++) {
        corte.push(linha[ci] !== undefined ? linha[ci] : "");
      }
      semana.push(corte);
      // proteção: não crescer indefinidamente; limite de 20 linhas por segurança
      if (semana.length >= 20) break;
      continue;
    } else {
      // se a linha NÃO parece horário e não contém conteúdo útil -> terminar
      break;
    }
  }

  // Se o primeiro item da semana for um cabeçalho (ex.: "HORÁRIO", "SEGUNDA") -> remover linha do cabeçalho e manter datas+horários
  if (semana.length > 0) {
    const firstRowJoined = semana[0].join(" ").toLowerCase();
    if (firstRowJoined.includes("horário") || firstRowJoined.includes("horario") || firstRowJoined.includes("segunda")) {
      // remover a primeira linha para que a tabela comece nas linhas de horário reais (se aplicável)
      // porém, se for apenas cabeçalho+datas, podemos manter dependendo da estrutura.
      // aqui queremos exibir só as linhas de horário; então remover título se presente.
      semana.shift();
    }
  }

  // Se ainda a primeira linha não começar com horário, procurar na própria semana o primeiro que comece com horário e ajustar
  let idxPrimeiroHorario = -1;
  for (let i = 0; i < semana.length; i++) {
    if (horaRegex.test(semana[i][0]) || horaRangeRegex.test(semana[i][0]) || horaRegex.test((semana[i].slice(0,3)||[]).join(" "))) {
      idxPrimeiroHorario = i;
      break;
    }
  }
  if (idxPrimeiroHorario > 0) {
    return semana.slice(idxPrimeiroHorario);
  }

  return semana;
}

/* ============================
   Atualiza a tabela HTML com as linhas passadas
   Assume que cada linha tem até 7 colunas (A..G)
   ============================ */
function atualizarTabela(linhas) {
  const tbody = document.getElementById("gradeBody");
  tbody.innerHTML = "";

  if (!linhas || linhas.length === 0) {
    // mostrar mensagem ou limpar
    document.getElementById("gradeContainer").style.display = "block";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.textContent = "Nenhum horário encontrado nesta turma (verifique a aba).";
    td.style.textAlign = "center";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  // inserir cada linha (limitando a 7 colunas)
  linhas.forEach(linha => {
    const tr = document.createElement("tr");
    for (let c = 0; c < 7; c++) {
      const td = document.createElement("td");
      td.textContent = (linha[c] !== undefined && linha[c] !== null) ? linha[c] : "";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });

  document.getElementById("gradeContainer").style.display = "block";
}
