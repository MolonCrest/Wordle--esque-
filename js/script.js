/*Jackson Hinks - Wordle type game - Javascript - 4/19/2026*/

const words = [
  "APPLE", "GRAPE", "HOUSE", "BRICK", "PLANT",
  "ADIEU", "TARES", "SOARE", "DUCAT", "OUIJA",
  "CAROM", "ERGOT", "CRAIC", "SQUAB", "AZURE",
  "QUIRK", "KARST", "XEBEC", "GNOME", "CRUET",
  "IGLOO", "SHARD", "OKAPI",

  "BREAD", "CHAIR", "TABLE", "WATER", "MOUSE",
  "STONE", "LIGHT", "CLOUD", "TRAIN", "SMILE",
  "SNAKE", "PLANE", "HEART", "DREAM", "BRUSH",
  "FROST", "SWEET", "FRAME", "GLASS", "FLOOR",
  "CROWN", "HORSE", "SHEEP", "FIELD", "BEACH",
  "RIVER", "BRAIN", "MUSIC", "PIZZA", "ZEBRA",
  "TIGER", "LEMON", "MANGO", "BERRY", "PEACH",
  "CHILI", "ONION", "BASIL", "ROBOT", "LASER",
  "SPACE", "EARTH", "VENUS", "MOTOR", "RADIO",
  "PHONE", "CLOCK", "SHIRT", "PANTS", "SHOES",

  "FJORD", "NYMPH", "GLYPH", "JOUST", "WALTZ",
  "ZESTY", "VAPID", "QUAIL", "JUMBO", "VOXEL",
  "PIXEL", "HAZEL", "MIRTH", "BLOKE", "CYNIC",
  "WRYLY", "ZONAL", "RHYME", "CRYPT", "LYMPH"
];

let game = {
  targetWord: "",
  currentRow: 0,
  currentCol: 0,
  guesses: ["", "", "", "", "", ""],
  feedback: [[], [], [], [], [], []],
  state: "playing"
};

let stats = {
  wins: 0,
  losses: 0
};

let seconds = 0;
let timerId = null;

const board = document.getElementById("board");
const statusText = document.getElementById("status");
const restartBtn = document.getElementById("restart-btn");
const keyboard = document.getElementById("keyboard");
const timerText = document.getElementById("timer");
const statsText = document.getElementById("stats");

// Debug test:
// console.log("Board found:", board);
// console.log("Status found:", statusText);
// console.log("Restart button found:", restartBtn);
// console.log("Keyboard found:", keyboard);
// console.log("Timer found:", timerText);
// console.log("Stats found:", statsText);

function randomWord() {
  const chosenWord = words[Math.floor(Math.random() * words.length)];

  // Debug test:
  // console.log("Random word picked:", chosenWord);

  return chosenWord;
}

function loadStats() {
  const savedStats = localStorage.getItem("wordleEsqueStats");

  if (savedStats) {
    stats = JSON.parse(savedStats);

    // Debug test:
    // console.log("Loaded stats from localStorage:", stats);
  } else {
    // Debug test:
    // console.log("No saved stats found. Using default stats.");
  }
}

function saveStats() {
  localStorage.setItem("wordleEsqueStats", JSON.stringify(stats));

  // Debug test:
  // console.log("Saved stats to localStorage:", stats);
}

function drawStats() {
  if (!statsText) return;
  statsText.textContent = "Wins: " + stats.wins + " | Losses: " + stats.losses;
}

function startTimer() {
  stopTimer();
  seconds = 0;
  drawTimer();

  timerId = setInterval(function () {
    seconds++;
    drawTimer();

    // Debug test:
    // console.log("Timer seconds:", seconds);
  }, 1000);

  // Debug test:
  // console.log("Timer started.");
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;

    // Debug test:
    // console.log("Timer stopped.");
  }
}

function drawTimer() {
  if (!timerText) return;
  timerText.textContent = "Time: " + seconds + "s";
}

function makeBoard() {
  if (!board) {
    // Debug test:
    // console.log("Board element was not found. Check the HTML id='board'.");
    return;
  }

  board.innerHTML = "";

  for (let row = 0; row < 6; row++) {
    let rowDiv = document.createElement("div");
    rowDiv.className = "row";

    for (let col = 0; col < 5; col++) {
      let tile = document.createElement("div");
      tile.className = "tile";
      tile.id = "tile-" + row + "-" + col;
      rowDiv.appendChild(tile);

      // Debug test:
      // console.log("Created tile:", tile.id);
    }

    board.appendChild(rowDiv);

    // Debug test:
    // console.log("Created row:", row);
  }

  // Debug test:
  // console.log("Board was built.");
}

function makeKeyboard() {
  if (!keyboard) {
    // Debug test:
    // console.log("Keyboard element was not found.");
    return;
  }

  keyboard.innerHTML = "";

  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
  ];

  for (let i = 0; i < rows.length; i++) {
    let rowDiv = document.createElement("div");
    rowDiv.className = "key-row";

    for (let j = 0; j < rows[i].length; j++) {
      let btn = document.createElement("button");
      btn.className = "key";
      btn.textContent = rows[i][j];
      btn.dataset.key = rows[i][j];

      if (rows[i][j] === "ENTER" || rows[i][j] === "BACKSPACE") {
        btn.classList.add("wide");
      }

      btn.addEventListener("click", function () {
        // Debug test:
        // console.log("On-screen key clicked:", rows[i][j]);

        keyInput(rows[i][j]);
        drawBoard();
        drawKeyboard();
      });

      rowDiv.appendChild(btn);
    }

    keyboard.appendChild(rowDiv);
  }

  // Debug test:
  // console.log("Keyboard was built.");
}

function drawKeyboard() {
  if (!keyboard) return;

  const buttons = keyboard.querySelectorAll(".key");
  const keyRanks = {
    absent: 1,
    present: 2,
    correct: 3
  };

  buttons.forEach(function (button) {
    button.classList.remove("correct", "present", "absent");
  });

  for (let row = 0; row < game.currentRow + 1; row++) {
    for (let col = 0; col < 5; col++) {
      let letter = game.guesses[row][col];
      let color = game.feedback[row][col];

      if (!letter || !color) continue;

      const button = keyboard.querySelector('[data-key="' + letter + '"]');

      if (!button) continue;

      const currentClass =
        button.classList.contains("correct") ? "correct" :
        button.classList.contains("present") ? "present" :
        button.classList.contains("absent") ? "absent" : "";

      if (!currentClass || keyRanks[color] > keyRanks[currentClass]) {
        button.classList.remove("correct", "present", "absent");
        button.classList.add(color);

        // Debug test:
        // console.log("Updated keyboard key:", letter, "to", color);
      }
    }
  }
}

function drawBoard() {
  if (!board || !statusText) {
    // Debug test:
    // console.log("Board or status element missing, drawBoard stopped.");
    return;
  }

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      let tile = document.getElementById("tile-" + row + "-" + col);

      if (!tile) {
        // Debug test:
        // console.log("Missing tile:", "tile-" + row + "-" + col);
        continue;
      }

      let letter = game.guesses[row][col] || "";
      let color = game.feedback[row][col] || "";

      tile.textContent = letter;
      tile.className = "tile";

      if (color) {
        tile.classList.add(color);
      }
    }
  }

  if (game.state === "playing") {
    statusText.textContent = "Type a word to begin.";
  } else if (game.state === "win") {
    statusText.textContent = "You won in " + seconds + " seconds!";
  } else if (game.state === "lose") {
    statusText.textContent = "You lost! The word was " + game.targetWord + ".";
  }

  drawStats();
  drawTimer();
  drawKeyboard();

  // Debug test:
  // console.log("Board drawn.");
  // console.log("Current row:", game.currentRow);
  // console.log("Current col:", game.currentCol);
  // console.log("Current guesses:", game.guesses);
  // console.log("Current feedback:", game.feedback);
  // console.log("Current state:", game.state);
}

function checkGuess(guess, word) {
  let result = ["absent", "absent", "absent", "absent", "absent"];
  let wordLetters = word.split("");

  // Debug test:
  // console.log("Checking guess:", guess);
  // console.log("Against word:", word);

  for (let i = 0; i < 5; i++) {
    if (guess[i] === wordLetters[i]) {
      result[i] = "correct";
      wordLetters[i] = null;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;

    let letterIndex = wordLetters.indexOf(guess[i]);

    if (letterIndex !== -1) {
      result[i] = "present";
      wordLetters[letterIndex] = null;
    }
  }

  // Debug test:
  // console.log("Guess result:", result);

  return result;
}

function animateRow(row, className) {
  for (let col = 0; col < 5; col++) {
    let tile = document.getElementById("tile-" + row + "-" + col);

    if (!tile) continue;

    tile.classList.remove(className);
    void tile.offsetWidth;
    tile.classList.add(className);

    tile.addEventListener("animationend", function removeAnim() {
      tile.classList.remove(className);
      tile.removeEventListener("animationend", removeAnim);
    });

    // Debug test:
    // console.log("Animating tile:", tile.id, "with", className);
  }
}

function finishGame(result) {
  if (result === "win") {
    game.state = "win";
    stats.wins++;
  } else if (result === "lose") {
    game.state = "lose";
    stats.losses++;
  }

  saveStats();
  stopTimer();

  // Debug test:
  // console.log("Game finished with result:", result);
  // console.log("Updated stats:", stats);
}

function keyInput(key) {
  if (game.state !== "playing") {
    // Debug test:
    // console.log("Input blocked because game is not in playing state.");
    return;
  }

  // Debug test:
  // console.log("Key received:", key);

  if (/^[A-Z]$/.test(key)) {
    if (game.currentCol < 5) {
      game.guesses[game.currentRow] += key;
      game.currentCol++;

      // Debug test:
      // console.log("Letter added:", key);
      // console.log("Updated guess:", game.guesses[game.currentRow]);
      // console.log("Current column:", game.currentCol);
    } else {
      // Debug test:
      // console.log("Row already has 5 letters. Extra key ignored.");
    }
  }

  if (key === "BACKSPACE") {
    if (game.currentCol > 0) {
      game.guesses[game.currentRow] = game.guesses[game.currentRow].slice(0, -1);
      game.currentCol--;

      // Debug test:
      // console.log("Backspace used.");
      // console.log("Updated guess:", game.guesses[game.currentRow]);
      // console.log("Current column:", game.currentCol);
    } else {
      // Debug test:
      // console.log("Backspace ignored because row is already empty.");
    }
  }

  if (key === "ENTER") {
    let guess = game.guesses[game.currentRow];

    // Debug test:
    // console.log("Trying to submit guess:", guess);

    if (guess.length !== 5) {
      statusText.textContent = "Enter 5 letters first.";
      animateRow(game.currentRow, "shake");

      // Debug test:
      // console.log("Guess was too short:", guess.length);
      return;
    }

    game.feedback[game.currentRow] = checkGuess(guess, game.targetWord);
    animateRow(game.currentRow, "flip");

    // Debug test:
    // console.log("Guess submitted:", guess);
    // console.log("Target word:", game.targetWord);
    // console.log("Feedback for row:", game.feedback[game.currentRow]);

    if (guess === game.targetWord) {
      finishGame("win");
      return;
    }

    if (game.currentRow === 5) {
      finishGame("lose");
      return;
    }

    game.currentRow++;
    game.currentCol = 0;

    // Debug test:
    // console.log("Moved to next row:", game.currentRow);
  }
}

function restartGame() {
  game.targetWord = randomWord();
  game.currentRow = 0;
  game.currentCol = 0;
  game.guesses = ["", "", "", "", "", ""];
  game.feedback = [[], [], [], [], [], []];
  game.state = "playing";

  startTimer();
  drawBoard();

  // Debug test:
  // console.log("Game restarted.");
  // console.log("New target word:", game.targetWord);
  // console.log("Guesses reset:", game.guesses);
  // console.log("Feedback reset:", game.feedback);
}

document.addEventListener("keydown", function (event) {
  if (!board) {
    // Debug test:
    // console.log("No board on this page. Key input ignored.");
    return;
  }

  // Debug test:
  // console.log("Raw key pressed:", event.key);

  keyInput(event.key.toUpperCase());
  drawBoard();
});

if (restartBtn) {
  restartBtn.addEventListener("click", function () {
    // Debug test:
    // console.log("Restart button clicked.");

    restartGame();
  });
} else {
  // Debug test:
  // console.log("Restart button not found on this page.");
}

if (board) {
  loadStats();
  makeBoard();
  makeKeyboard();
  restartGame();
} else {
  // Debug test:
  // console.log("Board not found, so game setup was skipped.");
}

const navLinks = document.querySelectorAll("nav a");

// Debug test:
// console.log("Nav links found:", navLinks.length);

navLinks.forEach(function (link) {
  link.addEventListener("click", function (event) {
    event.preventDefault();

    const nextPage = link.href;

    // Debug test:
    // console.log("Nav link clicked.");
    // console.log("Going to page:", nextPage);

    document.body.classList.add("page-fade");

    setTimeout(function () {
      // Debug test:
      // console.log("Fade finished, loading next page.");

      window.location.href = nextPage;
    }, 250);
  });
});