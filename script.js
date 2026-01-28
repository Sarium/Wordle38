const TIMEZONE_OFFSET = -3; // Brasília (GMT-3)
const MAX_GUESSES = 6;
const STORAGE_KEY = "Wordle38-state";

function isAdmin() {
  return new URLSearchParams(window.location.search).get("admin") === "true";
}

let characters = [];
let dailyCharacter = null;
let resultsHistory = [];
let gameState = {
  day: null,
  guesses: [],
  completed: false,
  won: false
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
  if (a === b) return "match";
  if (a && b) return "partial";
  return "nope";
}

function comparePowers(a, b) {
  const overlap = a.filter(p => b.includes(p));
  if (overlap.length === a.length && a.length === b.length) return "match";
  if (overlap.length > 0) return "partial";
  return "nope";
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

  const results = [
    compareExact(guessChar.birthplace, dailyCharacter.birthplace),
    compareExact(guessChar.firstAppearance, dailyCharacter.firstAppearance),
    compareExact(guessChar.species, dailyCharacter.species),
    comparePowers(guessChar.powers, dailyCharacter.powers)
  ];

  gameState.guesses.push({
  name: guessChar.name,
  values: {
    birthplace: guessChar.birthplace,
    firstAppearance: guessChar.firstAppearance,
    species: guessChar.species,
    powers: guessChar.powers
  },
  results
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

/* ---------------- RENDER ---------------- */

function renderGuessRow(guess) {
  const row = document.createElement("tr");

  // 🔄 Backward compatibility
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

  row.innerHTML = `
    <td>${guess.name}</td>

    <td class="${guess.results[0]}">
      ${values.birthplace}
    </td>

    <td class="${guess.results[1]}">
      ${values.firstAppearance}
    </td>

    <td class="${guess.results[2]}">
      ${values.species}
    </td>

    <td class="${guess.results[3]}">
      ${values.powers.join(", ")}
    </td>
  `;

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
  let text = `Wordle38 #${gameState.day}\n\n`;
  gameState.guesses.forEach(g => {
    text += g.results.map(toEmoji).join("") + "\n";
  });
  text += "\nJogue em: sarium.github.io/Wordle38";

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
    `Next character in ${h}h ${m}m ${s}s`;
}

/* ---------------- END ---------------- */

function endGame(won) {
  document.getElementById("guessInput").disabled = true;
  document.getElementById("guessButton").disabled = true;

  document.getElementById("shareButton").style.display = "inline-block";

  if (!won) {
    alert(`❌ Out of guesses! Today's character was ${dailyCharacter.name}`);
  }
}




