const TIMEZONE_OFFSET = -3; // Brasília (GMT-3)
const MAX_GUESSES = 10;
const STORAGE_KEY = "Wordle38-state";

function isAdmin() {
  return new URLSearchParams(window.location.search).get("admin") === "true";
}
function isAdminReset() {
  return new URLSearchParams(window.location.search).get("admin") === "reset";
}

const LAUNCH_DAY = 20481;

let characters = [];
let dailyCharacter = null;
let resultsHistory = [];
let gameState = {
  day: null,
  guesses: [],
  completed: false,
  won: false
};

function normalizePower(power) {
  return power
    .toLowerCase()
    .replace(/\s+(laranja|roxo|original|de pecado|do som|da memória|parcialmente)$/i, "")
    .trim();
}

const POWER_SOURCES = {
  "Conexão": {
    children: {
      "Marca": {
        children: {}
      },
      "Herança": {
        children: {}
      },
      "Besta":{
        children: {}
      }
    }
  },
  "Vida": {
    children: {
      "Alma": {
        children: {}
      },
      "Título": {
        children: {}
      },
      "Habilidades": {
        children: {}
      }
    }
  }
};

const POWER_DICTIONARY = {
  "Despertar": {
    family: "Despertar",
    source: "Marca",
    description: "O poder oríginario de uma Marca. Involve utilizar Energia para criar, controlar ou modificar algo. Brilha branco."
  },
  "Despertar Laranja": {
    family: "Despertar",
    source: "Marca",
    description: "Variação Laranja de um Despertar. Não usa Energia, ao invés disso se baseando inteiramente na Casca."
  },
  "Despertar Roxo": {
    family: "Despertar",
    source: "Marca",
    description: "Variação Roxa de um Despertar. Consome muito mais Energia do que precisa, mas seus poderes são amplificados de varias maneiras."
  },
  "Despertar de Pecado": {
    family: "Despertar",
    source: "Marca",
    description: "Variação de um Despertar, criado pelo Pai dos Pecados (Atrax). Poderes tem efeitos permanentes e descontrolaveis no seu ser."
  },
  "Despertar Original": {
    family: "Despertar",
    source: "Marca",
    description: "Variação de um Despertar, criado por um Relíquario. Propriedades ainda desconhecidas."
  },
  "Sexto Sentido": {
    family: "Sexto Sentido",
    source: "Marca",
    description: "Uma evolução de um Despertar, permitindo que um Despertado tenha sentidos baseados em sua Palavra"
  },
  "Segundo Despertar": {
    family: "Segundo Despertar",
    source: "Marca",
    description: "Uma evolução de um Despertar. Propriedades ainda desconhecidas"
  },
  "Herança do Som": {
    family: "Herança",
    source: "Herança",
    description: "Permite a criação e manipulação de ondas sonoras."
  },
  "Herança da Memória": {
    family: "Herança",
    source: "Herança",
    description: "Permite a manipulação de memórias."
  },
  "Runas": {
    family: "Runas",
    source: "Habilidades",
    description: "A habilidade de utilizar Prácuo, a antiga língua dos Dragões."
  },
  "Retornado": {
    family: "Retornado",
    source: "Alma",
    description: "Alguem que morreu e então, por meio de uma benção dos Guardiões, retornou a vida."
  },
  "Contrato": {
    family: "Contrato",
    source: "Conexão",
    description: "A habilidade de criar Contratos"
  },
  "Mensageiro": {
    family: "Mensageiro",
    source: "Alma",
    description: "Escolhido pelo Chefe para se tornar um Mensageiro"
  },
  "Deus": {
    family: "Deus",
    source: "Título",
    description: "Um cargo mais do que um poder. Cultuado por pelo menos dez pessoas."
  },
  "Relíquia": {
    family: "Relíquia",
    source: "Conexão",
    description: "Alguem que possui um laço com uma Relíquia."
  },
  "Olho de Alma": {
    family: "Olho de Alma",
    source: "Alma",
    description: "Alguem que possui um Olho de Alma."
  },
  "Visão do Futuro": {
    family: "Visão do Futuro",
    source: "Habilidades",
    description: "A habilidade de prever o futuro. Geralmente alcançado atráves de inteligência extrema."
  },
  "Controle de Energia": {
    family: "Controle de Energia",
    source: "Habilidades",
    description: "A habilidade de controlar sua Energia por metodos puramente naturais."
  },
  "Espírito": {
    family: "Espírito",
    source: "Alma",
    description: "Uma pessoa sem Casca, presa em sua Alma."
  },
  "Vampiro": {
    family: "Vampiro",
    source: "Alma",
    description: "Uma pessoa que consome Alma para se sustentar."
  },
  "Bestialização": {
    family: "Bestialização",
    source: "Besta",
    description: "Uma pessoa unida a uma Besta de Inexistencia."
  },
  "Conexão": {
    family: "Conexão",
    source: "Conexão",
    description: "Possui uma Conexão a alguma coisa ou pessoa."
  },
};





/* ---------------- TIME / DAY ---------------- */

function getBrasiliaDayNumber() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const brasilia = new Date(utc + TIMEZONE_OFFSET * 3600000);
  return Math.floor(brasilia.getTime() / 86400000);
}

/* ---------------- INIT ---------------- */

fetch("characters.json")
  .then(res => res.json())
  .then(data => {
    characters = data;
    initGame();
  });

function initGame() {
  if (isAdminReset()) {
  localStorage.removeItem(STORAGE_KEY);
}
  
// FNV-1a hash function
function fnv1aHash(str) {
  let hash = 2166136265; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash >>> 0) * 16777619 >>> 0; // multiply by FNV prime
  }
  return hash >>> 0; // ensure unsigned 32-bit integer
}

// Seeded pseudo-random generator based on a number
function seededRandom(seed) {
  // Xorshift algorithm
  let x = seed >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 0xFFFFFFFF; // return number between 0 and 1
}

// Get the "daily number" for today
const today = getBrasiliaDayNumber(); // your function returning an integer

// Generate a robust seed string (e.g., include a salt if you want)
const seedString = `dailyCharacter-${today}`;

// Hash the seed string to get a numeric seed
const seed = fnv1aHash(seedString);

// Pick the daily character
dailyCharacter = characters[Math.floor(seededRandom(seed) * characters.length)];
  
const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

  if (saved && saved.day === today) {
    gameState = saved;
  } else {
    gameState = {
      day: today,
      guesses: [],
      completed: false,
      won: false
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }

  gameState.guesses.forEach(g => renderGuessRow(g));
  if (gameState.completed) endGame(gameState.won);

  setupUI();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  if (isAdmin()) {
  console.log("🛠️ ADMIN — Daily Character:", dailyCharacter);
}
updateStatsUI();

}

/* ---------------- UI ---------------- */

function setupUI() {
  const input = document.getElementById("guessInput");
  const button = document.getElementById("guessButton");
  const suggestionsBox = document.getElementById("suggestions");

  input.addEventListener("input", () => {
    suggestionsBox.innerHTML = "";
    const value = input.value.toLowerCase();
    if (!value) return;

    characters
      .filter(c => c.name.toLowerCase().includes(value))
      .forEach(char => {
        const div = document.createElement("div");
        div.className = "suggestion";
        div.textContent = char.name;
        div.onclick = () => {
          input.value = char.name;
          suggestionsBox.innerHTML = "";
          input.focus();
        };
        suggestionsBox.appendChild(div);
      });
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") submitGuess();
  });

  button.addEventListener("click", submitGuess);

  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete")) {
      suggestionsBox.innerHTML = "";
    }
  });

  const shareBtn = document.getElementById("shareButton");
  if (shareBtn) {
    shareBtn.addEventListener("click", shareResults);
  }
  
  gameState.guesses.forEach(g => renderGuessRow(g));
  updateGuessCounter();

const powerBtn = document.getElementById("powerDictionaryBtn");
const modal = document.getElementById("powerModal");
const closeBtn = document.getElementById("closePowerModal");

powerBtn.addEventListener("click", () => {
  buildPowerDictionary();
  modal.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

  modal.addEventListener("click", e => {
  if (e.target === modal) modal.classList.add("hidden");
});

  const searchInput = document.getElementById("powerSearch");

searchInput.addEventListener("input", () => {
  buildPowerDictionary(searchInput.value);
});

  powerBtn.addEventListener("click", () => {
  searchInput.value = "";
  buildPowerDictionary();
  modal.classList.remove("hidden");
});
}

function getSourceChain(sourceName) {
  const chain = [];

  function traverse(node, path) {
    for (const key in node) {
      const nextPath = [...path, key];
      if (key === sourceName) {
        chain.push(...nextPath);
        return true;
      }
      if (node[key].children && traverse(node[key].children, nextPath)) {
        return true;
      }
    }
    return false;
  }

  traverse(POWER_SOURCES, []);
  return chain;
}

function buildPowerDictionary(search = "") {
  search = search.trim().toLowerCase();
  const container = document.getElementById("powerList");
  container.innerHTML = "";
  container.className = "power-tree";

  // Helper: render a row with prefix based on depth
  function renderRow(label, depth, isLast, className = "") {
    const row = document.createElement("div");
    row.className = `tree-row ${className}`;
    row.dataset.depth = depth;
    row.dataset.last = isLast ? "true" : "false";
    row.style.setProperty("--depth", depth);
    row.innerHTML = `
      <span class="tree-prefix"></span>
      <span class="tree-label">${label}</span>
    `;
    container.appendChild(row);
    return row;
  }

  // Recursive source renderer
  function renderSource(name, node, depth = 0) {
    // Collect powers for this source that match search
    const powersByFamily = {};
    Object.entries(POWER_DICTIONARY).forEach(([power, info]) => {
      const matches =
        !search ||
        power.toLowerCase().includes(search) ||
        info.description?.toLowerCase().includes(search);
      if (info.source === name && matches) {
        powersByFamily[info.family] ??= [];
        powersByFamily[info.family].push({ name: power, info });
      }
    });

    const families = Object.entries(powersByFamily);

    // Render source itself only if it has powers or children
    const hasChildren = node.children && Object.keys(node.children).length > 0;
    if (families.length > 0 || hasChildren) {
      renderRow(name, depth, false, "tree-family");
    }

    families.forEach(([family, powers], i) => {
      const lastFamily = i === families.length - 1;
      renderRow(family, depth + 1, lastFamily, "tree-family");

      powers.forEach((p, j) => {
        const lastPower = j === powers.length - 1;
        renderRow(p.name, depth + 2, lastPower, "tree-power");

        if (p.info.description) {
          renderRow(p.info.description, depth + 3, true, "tree-description");
        }
      });
    });

    // Recurse into children
    if (hasChildren) {
      const entries = Object.entries(node.children);
      entries.forEach(([child, childNode], i) => {
        const lastChild = i === entries.length - 1;
        renderSource(child, childNode, depth + 1);
      });
    }
  }

  // Start rendering from root sources
  Object.entries(POWER_SOURCES).forEach(([name, node]) => {
    renderSource(name, node, 0);
  });
}


document.addEventListener("click", e => {
  const row = e.target.closest(".collapsible");
  if (!row) return;

  const startDepth = Number(row.dataset.depth);
  const expanded = row.dataset.expanded === "true";
  row.dataset.expanded = expanded ? "false" : "true";

  let next = row.nextElementSibling;

  while (next) {
    const nextDepth = Number(next.dataset.depth);
    if (nextDepth <= startDepth) break;

    next.style.display = expanded ? "none" : "";
    next = next.nextElementSibling;
  }
});

/* ---------------- GAME LOGIC ---------------- */

function compareExact(a, b) {
  return a === b ? "match" : "nope";
}


function comparePowers(guess, target) {
  const exactOverlap = guess.filter(p => target.includes(p)).length;

  const normalizedGuess = guess.map(normalizePower);
  const normalizedTarget = target.map(normalizePower);

  const familyOverlap = [...new Set(
    normalizedGuess.filter(p => normalizedTarget.includes(p))
  )].length;

  let result = "nope";

  if (exactOverlap === guess.length && guess.length === target.length) {
    result = "match";
  } else if (familyOverlap > 0) {
    result = "partial";
  }

  return {
    result,
    exact: exactOverlap,
    families: familyOverlap,
    total: guess.length
  };
}


function submitGuess() {
  if (gameState.completed) return;

  if (gameState.guesses.length >= MAX_GUESSES) {
    endGame(false);
    return;
  }

  const input = document.getElementById("guessInput");
  const guessChar = characters.find(
    c => c.name.toLowerCase() === input.value.toLowerCase()
  );

  if (!guessChar) return;

  const nameResult =
  guessChar.name === dailyCharacter.name ? "match" : "nope";
  


  const powersResult = comparePowers(
    guessChar.powers,
  dailyCharacter.powers
  );

  
const results = [
  nameResult,
  compareExact(guessChar.birthplace, dailyCharacter.birthplace),
  compareExact(guessChar.firstAppearance, dailyCharacter.firstAppearance),
  compareExact(guessChar.species, dailyCharacter.species),
  powersResult.result
];


  gameState.guesses.push({
  name: guessChar.name,
  values: {
    birthplace: guessChar.birthplace,
    firstAppearance: guessChar.firstAppearance,
    species: guessChar.species,
    powers: guessChar.powers
  },
  results,
  powersInfo: powersResult
});

  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));

  updateGuessCounter();

  renderGuessRow({ name: guessChar.name, results });

  input.value = "";

  if (guessChar.name === dailyCharacter.name) {
    gameState.completed = true;
    gameState.won = true;
    updateStreak(true);
    updateStatsUI();
    endGame(true);
    return;
  }

  if (gameState.guesses.length >= MAX_GUESSES) {
    gameState.completed = true;
    gameState.won = false;
    updateStreak(false);
    updateStatsUI();
    endGame(false);
  }
}

function getPuzzleNumber() {
  return gameState.day - LAUNCH_DAY + 1;
}

function getPowerDescription(power) {
  return POWER_DICTIONARY[power]?.description || "Sem descrição disponível.";
}

/* ---------------- RENDER ---------------- */

function renderGuessRow(guess) {
  const row = document.createElement("tr");

  // backward compatibility
  let values = guess.values;
  if (!values) {
    const char = characters.find(c => c.name === guess.name);
    if (!char) return;
    values = {
      birthplace: char.birthplace,
      firstAppearance: char.firstAppearance,
      species: char.species,
      powers: char.powers
    };
  }

  let powersInfo = guess.powersInfo;

  if (!powersInfo) {
  const exactOverlap = values.powers.filter(p =>
    dailyCharacter.powers.includes(p)
  ).length;

  const normalizedGuess = values.powers.map(normalizePower);
  const normalizedTarget = dailyCharacter.powers.map(normalizePower);

  const familyOverlap = [...new Set(
    normalizedGuess.filter(p => normalizedTarget.includes(p))
  )].length;
    
  powersInfo = {
    result: guess.results[4],
    exact: exactOverlap,
    families: familyOverlap,
    total: values.powers.length
  };
}

let inlineCount
  
if (powersInfo.families !== powersInfo.exact) {
  inlineCount =
    `${powersInfo.exact}(${powersInfo.families})/${powersInfo.total}`;
} else {
  inlineCount =
    `${powersInfo.exact}/${powersInfo.total}`;
}
  
const infoIcon = " ⓘ";
  
let hoverText = `Poderes Exatos: ${powersInfo.exact}\n`;

if (powersInfo.families !== powersInfo.exact) {
  hoverText +=
    `Famílias de Poderes: ${powersInfo.families}\n` +
    `(ex: Despertar Laranja, Despertar Roxo → Despertar)\n`;
}

hoverText += `Total de Poderes do Chute: ${powersInfo.total}`;


  
  row.innerHTML = `
    <td class="${guess.results[0]}">
      ${guess.name}
    </td>

    <td class="${guess.results[1]}">
      ${values.birthplace}
    </td>

    <td class="${guess.results[2]}">
      ${values.firstAppearance}
    </td>

    <td class="${guess.results[3]}">
      ${values.species}
    </td>
  
<td class="${guess.results[4]}" title="${hoverText}">
  ${values.powers.join(", ")}<span class="power-count ${guess.results[4] === "partial" ? "active" : "dim"}">
  ${inlineCount}${infoIcon}
</span>
</td>


`

  document.querySelector("#results tbody").appendChild(row);
}


function updateGuessCounter() {
  const counter = document.getElementById("guessCounter");
  counter.textContent = `Guesses: ${gameState.guesses.length} / ${MAX_GUESSES}`;
}


/* ---------------- SHARE ---------------- */

function toEmoji(r) {
  return r === "match" ? "🟩" : r === "partial" ? "🟨" : "⬛";
}

function shareResults() {
let text = `Wordle38 #${getPuzzleNumber()}\n\n`;
  gameState.guesses.forEach(g => {
    text += g.results.map(toEmoji).join("") + "\n";
  });
  text += "\nJogue em: https://sarium.github.io/Wordle38";

  navigator.clipboard.writeText(text);
  alert("Copiado para a área de transferência!");
}

/* ---------------- STATS ---------------- */

function updateStreak(won) {
  const today = getBrasiliaDayNumber();

  const stats = JSON.parse(localStorage.getItem("Wordle38-stats")) || {
    streak: 0,
    maxStreak: 0,
    lastPlayedDay: null
  };

  if (won) {
    if (stats.lastPlayedDay === today - 1) {
      // Consecutive win
      stats.streak += 1;
    } else if (stats.lastPlayedDay === today) {
      // Already counted today — do nothing
      return;
    } else {
      // Not consecutive → reset to 1
      stats.streak = 1;
    }

    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
  } else {
    stats.streak = 0;
  }

  stats.lastPlayedDay = today;

  localStorage.setItem("Wordle38-stats", JSON.stringify(stats));
}

function updateStatsUI() {
  const stats = JSON.parse(localStorage.getItem("Wordle38-stats")) || {
    streak: 0,
    maxStreak: 0
  };

  document.getElementById("streak").textContent = stats.streak;
  document.getElementById("maxStreak").textContent = stats.maxStreak;
}


/* ---------------- COUNTDOWN ---------------- */

function updateCountdown() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const brasilia = new Date(utc + TIMEZONE_OFFSET * 3600000);

  const tomorrow = new Date(brasilia);
  tomorrow.setHours(24, 0, 0, 0);

  const diff = tomorrow - brasilia;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  document.getElementById("countdown").textContent =
    `Próximo Personagem em ${h}h ${m}m ${s}s`;
}

/* ---------------- END ---------------- */

function endGame(won) {
  document.getElementById("guessInput").disabled = true;
  document.getElementById("guessButton").disabled = true;

  document.getElementById("shareButton").style.display = "inline-block";

  if (!won) {
    alert(`Acabaram seus chutes! O personagem de hoje foi: ${dailyCharacter.name}`);
  }
}

















