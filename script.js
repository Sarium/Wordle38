// 🔹 CHARACTER DATABASE
const characters = [
  {
    name: "Lan",
    birthplace: "Shizunda",
    firstAppearance: "Deus das Rosas",
    species: "Humano",
    powers: ["Despertar", "Retornado", "Mensageiro", "Contrato", "Runas"]
  },
  {
    name: "Sethe",
    birthplace: "Cetate",
    firstAppearance: "Deus das Rosas",
    species: "Humano",
    powers: ["Despertar", "Sexto Sentido", "Segundo Despertar", "Retornado", "Deus", "Conexão"]
  },
  {
    name: "Selen",
    birthplace: "Suol",
    firstAppearance: "Engenheiro dos Homens",
    species: "Humano",
    powers: ["Despertar", "Relíquia"]
  }
];

// 🔹 PICK DAILY CHARACTER (based on date)
const todayIndex = new Date().getDate() % characters.length;
const dailyCharacter = characters[todayIndex];

// 🔹 Populate dropdown
const select = document.getElementById("guessSelect");
characters.forEach(char => {
  const option = document.createElement("option");
  option.value = char.name;
  option.textContent = char.name;
  select.appendChild(option);
});

// 🔹 Comparison helpers
function compareValue(guess, target) {
  if (guess === target) return "match";
  if (guess && target && guess !== target) return "partial";
  return "nope";
}

function comparePowers(guessPowers, targetPowers) {
  if (guessPowers.some(p => targetPowers.includes(p))) {
    return guessPowers.length === targetPowers.length ? "match" : "partial";
  }
  return "nope";
}

// 🔹 Submit guess
function submitGuess() {
  const guessName = select.value;
  if (!guessName) return;

  const guessChar = characters.find(c => c.name === guessName);
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${guessChar.name}</td>
    <td class="${compareValue(guessChar.birthplace, dailyCharacter.birthplace)}"></td>
    <td class="${compareValue(guessChar.firstAppearance, dailyCharacter.firstAppearance)}"></td>
    <td class="${compareValue(guessChar.species, dailyCharacter.species)}"></td>
    <td class="${comparePowers(guessChar.powers, dailyCharacter.powers)}"></td>
  `;

  document.querySelector("#results tbody").appendChild(row);

  if (guessChar.name === dailyCharacter.name) {
    alert("🎉 You found today’s character!");
  }
}
