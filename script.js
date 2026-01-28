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

const daySeed = Math.floor(Date.now() / 86400000);
const dailyCharacter = characters[daySeed % characters.length];

// 🔹 Populate dropdown
const datalist = document.getElementById("characters");
characters.forEach(char => {
  const option = document.createElement("option");
  option.value = char.name;
  datalist.appendChild(option);
});

// 🔹 Comparison helpers
function compareExact(guess, target) {
  if (guess === target) return "match";
  if (guess && target) return "partial";
  return "nope";
}

function submitGuess() {
  const input = document.getElementById("guessInput");
  const guessName = input.value.trim();

  const guessChar = characters.find(
    c => c.name.toLowerCase() === guessName.toLowerCase()
  );

  if (!guessChar) {
    alert("Character not found.");
    return;
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
    alert("Você achou o personagem!");
  }
}
