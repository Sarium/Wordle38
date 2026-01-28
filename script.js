let characters = [];

fetch("characters.json")
  .then(res => res.json())
  .then(data => {
    characters = data;
    initGame();
  });

function initGame() {
function getBrasiliaDayNumber() {
  const now = new Date();

  // Convert local time → UTC → Brasília
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const brasiliaTime = new Date(utc + TIMEZONE_OFFSET * 3600000);

  return Math.floor(brasiliaTime.getTime() / 86400000);
}

const todayDay = getBrasiliaDayNumber();

const dailyCharacter = characters[todayDay % characters.length];
  
const resultsHistory = [];

const STORAGE_KEY = "Wordle38-state";

let gameState = {
  day: todayDay,
  guesses: [],
  completed: false,
  won: false
};

const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

if (saved && saved.day === todayDay) {
  gameState = saved;
} else {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

  
  
const MAX_GUESSES = 6; // 👈 change this anytime
const TIMEZONE_OFFSET = -3; // Brasilia (GMT-3)

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("guessInput");
  const button = document.getElementById("guessButton");
  const suggestionsBox = document.getElementById("suggestions");
  gameState.guesses.forEach(guess => {
  renderGuessRow(guess);
});

if (gameState.completed) {
  endGame(gameState.won);
}


  // 🔽 Autocomplete filtering
  input.addEventListener("input", () => {
    const value = input.value.toLowerCase();
    suggestionsBox.innerHTML = "";

    if (!value) return;

    const matches = characters.filter(c =>
      c.name.toLowerCase().includes(value)
    );

    matches.forEach(char => {
      const div = document.createElement("div");
      div.className = "suggestion";
      div.textContent = char.name;

      div.addEventListener("click", () => {
        input.value = char.name;
        suggestionsBox.innerHTML = "";
        input.focus();
      });

      suggestionsBox.appendChild(div);
    });
  });

  // ⌨️ Enter submits
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitGuess();
      suggestionsBox.innerHTML = "";
    }
  });

  // 🖱 Button submits
  button.addEventListener("click", submitGuess);

  // ❌ Click outside closes suggestions
  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete")) {
      suggestionsBox.innerHTML = "";
    }
  });
});

// 🔹 Comparison helpers
function compareExact(guess, target) {
  if (guess === target) return "match";
  if (guess && target) return "partial";
  return "nope";
}

function comparePowers(guess, target) {
  const overlap = guess.filter(p => target.includes(p));
  if (overlap.length === target.length && guess.length === target.length) {
    return "match";
  }
  if (overlap.length > 0) return "partial";
  return "nope";
}

function submitGuess() {
  if (gameState.completed) return;

if (gameState.guesses.length >= MAX_GUESSES) {
  endGame(false);
  return;
}

   const birthplaceResult = compareExact(
    guessChar.birthplace,
    dailyCharacter.birthplace
  );

  const appearanceResult = compareExact(
    guessChar.firstAppearance,
    dailyCharacter.firstAppearance
  );

  const speciesResult = compareExact(
    guessChar.species,
    dailyCharacter.species
  );

  const powersResult = comparePowers(
    guessChar.powers,
    dailyCharacter.powers
  );

  resultsHistory.push([
    birthplaceResult,
    appearanceResult,
    speciesResult,
    powersResult
  ]);

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${guessChar.name}</td>
    <td class="${birthplaceResult}">${guessChar.birthplace}</td>
    <td class="${appearanceResult}">${guessChar.firstAppearance}</td>
    <td class="${speciesResult}">${guessChar.species}</td>
    <td class="${powersResult}">${guessChar.powers.join(", ")}</td>
  `;

  document.querySelector("#results tbody").appendChild(row);
  input.value = "";
  const resultRow = [
  birthplaceResult,
  appearanceResult,
  speciesResult,
  powersResult
];

gameState.guesses.push(resultRow);
localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));

  }

  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${guessChar.name}</td>

    <td class="${compareExact(
      guessChar.birthplace,
      dailyCharacter.birthplace
    )}">
      ${guessChar.birthplace}
    </td>

    <td class="${compareExact(
      guessChar.firstAppearance,
      dailyCharacter.firstAppearance
    )}">
      ${guessChar.firstAppearance}
    </td>

    <td class="${compareExact(
      guessChar.species,
      dailyCharacter.species
    )}">
      ${guessChar.species}
    </td>

    <td class="${comparePowers(
      guessChar.powers,
      dailyCharacter.powers
    )}">
      ${guessChar.powers.join(", ")}
    </td>
  `;

  document.querySelector("#results tbody").appendChild(row);
  input.value = "";

if (guessChar.name === dailyCharacter.name) {
  gameState.completed = true;
  gameState.won = true;
  updateStreak(true);
  saveGame();
  endGame(true);
  return;
}

if (gameState.guesses.length >= MAX_GUESSES) {
  gameState.completed = true;
  gameState.won = false;
  updateStreak(false);
  saveGame();
  endGame(false);
}
  function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

display = "inline-block";
  }
  function toEmoji(result) {
  if (result === "match") return "🟩";
  if (result === "partial") return "🟨";
  return "⬛";
  }
  document.getElementById("shareButton").addEventListener("click", shareResults);

  function shareResults() {
    const dayNumber = Math.floor(Date.now() / 86400000);

    let text = `Wordle38 #${dayNumber}\n`;

    resultsHistory.forEach(row => {
      text += row.map(toEmoji).join("") + "\n";
    });

    text += "\nJogue em: sarium.github.io/Wordle38";

    navigator.clipboard.writeText(text).then(() => {
      alert("Copiado para Área de Transfêrencia!");
  });
    function renderGuessRow(results) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td></td>
    <td class="${results[0]}"></td>
    <td class="${results[1]}"></td>
    <td class="${results[2]}"></td>
    <td class="${results[3]}"></td>
  `;
  document.querySelector("#results tbody").appendChild(row);
}
    function updateStreak(won) {
  const stats = JSON.parse(localStorage.getItem("Wordle38-stats")) || {
    streak: 0,
    maxStreak: 0
  };

  if (won) {
    stats.streak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
  } else {
    stats.streak = 0;
  }

  localStorage.setItem("Wordle38-stats", JSON.stringify(stats));
}
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

setInterval(updateCountdown, 1000);
updateCountdown();
function endGame(won) {
  document.getElementById("guessInput").disabled = true;
  document.getElementById("guessButton").disabled = true;

  if (!won) {
    alert(`❌ Out of guesses! Today's character was ${dailyCharacter.name}`);
  }
}
}





