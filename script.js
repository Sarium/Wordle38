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
    .replace(/\s+(laranja|roxo|original|de pecado|do som| da memória)$/i, "")
    .trim();
}

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
  const today = getBrasiliaDayNumber();
  dailyCharacter = characters[today % characters.length];

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

}

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

const inlineCount =
  `${powersInfo.exact}(${powersInfo.families})/${powersInfo.total}`;
  
const infoIcon = " ⓘ";

const hoverText =
  `Poderes Exatos: ${powersInfo.exact}\n` +
  `Famílias de Poderes: ${powersInfo.families}\n` +
  `(ex: Despertar Laranja, Despertar Roxo → Despertar)\n` +
  `Total de Poderes do Chute: ${powersInfo.total}`;


  
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
  ${values.powers.join(", ")} ${inlineCount}${infoIcon}
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
  const stats = JSON.parse(localStorage.getItem("Wordle38-stats")) || {
    streak: 0,
    maxStreak: 0
  };

  stats.streak = won ? stats.streak + 1 : 0;
  stats.maxStreak = Math.max(stats.maxStreak, stats.streak);

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
