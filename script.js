let words = [];
let currentIndex = 0;
let currentWord = '';
let scrambled = '';
let score = 0;
let timer;
let timeLeft = 30;
let currentCategory = "";
let playerName = '';
let hintProgress = 0; // how many letters are revealed

const correctSound = new Audio('sounds/correct.mp3');
const wrongSound = new Audio('sounds/wrong.wav');
const timeoutSound = new Audio('sounds/timeout.mp3');
const countdownSound = new Audio('sounds/countdown.mp3');
const clickSound = new Audio('sounds/click.wav');

// Optional: preload for smoother playback
[correctSound, wrongSound, timeoutSound, countdownSound, clickSound].forEach(audio => {
  audio.preload = 'auto';
});

function startGame(category, level, isDaily = false) {
  playerName = prompt("Enter your name:");
  if (!playerName) {
    alert("Name is required to play.");
    return;
  }
  fetch('https://logic-word-puzzle.onrender.com/api/words')
    .then(response => response.json())
    .then(data => {
      // Load local custom words
      const customWords = JSON.parse(localStorage.getItem('customWords')) || {};
      const levelWords = (data[category] && data[category][level]) || [];
      const extraWords = (customWords[category] && customWords[category][level]) || []

      words = shuffleArray([...levelWords, ...extraWords]).slice(0, 10);

      score = 0;
      currentIndex = 0;
      document.getElementById('score').textContent = 'Score: 0';
      document.getElementById('level-name').textContent = `Category: ${category.toUpperCase()} | Level: ${level.toUpperCase()}`;

      document.getElementById('level-screen').classList.add('hidden');
      document.getElementById('game-screen').classList.remove('hidden');

       if (isDaily) {
        localStorage.setItem('isDaily', 'true');
      }

      nextWord();
    });
}


function scramble(word) {
  if (!word || word.length < 2) return word;
  let arr = word.split('');
  let shuffled = arr.slice();

  // Shuffle until it's not the same as original (avoid unchanged scramble)
  do {
    shuffled.sort(() => 0.5 - Math.random());
  } while (shuffled.join('') === word && word.length > 1);

  return shuffled.join('');
}

function nextWord() {
  clickSound.currentTime = 0;
  clickSound.play();
  clearInterval(timer);
  timeLeft = 30;
  hintProgress = 0;
  document.getElementById('hint').textContent = ''; // clear old hint
  document.getElementById('feedback').textContent = '';
  document.getElementById('user-input').value = '';
  document.getElementById('next-btn').classList.add('hidden');
  document.getElementById('progress').textContent = `Word ${currentIndex + 1} of ${words.length}`;
  hintProgress = 0;
  document.getElementById('hint').textContent = '';

  if (currentIndex >= words.length) {
    showResult();
    return;
  }

  currentWord = words[currentIndex];
  scrambled = scramble(currentWord);
  document.getElementById('scrambled-word').textContent = scrambled;

  startTimer();
  currentIndex++;
}

function checkAnswer() {
  const guess = document.getElementById('user-input').value.trim().toLowerCase();
  clearInterval(timer); // stop timer immediately

  if (isMultiplayer) {
    const currentPlayer = multiplayerData.players[multiplayerData.turn % 2];
    
    if (guess === currentWord) {
      correctSound.currentTime = 0;
      correctSound.play();
      currentPlayer.score += 5;
      currentPlayer.coins += 2;
      document.getElementById('feedback').textContent = '✅ Correct! (+2 coins)';
    } else {
       wrongSound.currentTime = 0;
       wrongSound.play();
      document.getElementById('feedback').textContent = `❌ Wrong! Correct: ${currentWord}`;
    }

    document.getElementById('score').textContent = `Score: ${currentPlayer.score}`;
    document.getElementById('coins').textContent = `Coins: ${currentPlayer.coins}`;
    document.getElementById('next-btn').onclick = nextMultiplayerTurn;
    multiplayerData.turn++;
    
  } else {
    if (guess === currentWord) {
       correctSound.currentTime = 0;
       correctSound.play();
      score += 5;
      coins += 2; // 🎁 Reward coins
      localStorage.setItem('puzzleCoins', coins);
      document.getElementById('feedback').textContent = '✅ Correct! (+2 coins)';
    } else {
      wrongSound.currentTime = 0;
      wrongSound.play();
      document.getElementById('feedback').textContent = `❌ Wrong! Correct: ${currentWord}`;
    }

    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('coins').textContent = `Coins: ${coins}`;
    document.getElementById('next-btn').onclick = nextWord;
  }

  document.getElementById('next-btn').classList.remove('hidden');
}


function startTimer() {
  document.getElementById('timer').textContent = `Time: ${timeLeft}`;
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = `Time: ${timeLeft}`;
    
    if (timeLeft <= 5 && timeLeft > 0) {
  countdownSound.currentTime = 0;
  countdownSound.play();
}

    if (timeLeft <= 0) {
      clearInterval(timer);
      timeoutSound.currentTime = 0;
      timeoutSound.play();
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  document.getElementById('feedback').textContent = `⏱️ Time's up! Correct: ${currentWord}`;
  document.getElementById('next-btn').classList.remove('hidden');
}

function showResult() {
  console.log("Showing result screen"); // ✅ Add this line
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('result-screen').classList.remove('hidden');

  let resultMsg = `Your final score is: ${score}`;

    if (localStorage.getItem('isDaily') === 'true') {
    resultMsg += ' 🎁 You completed today\'s challenge!';
    score += 10; // Reward
    localStorage.removeItem('isDaily');
  }

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('wordPuzzleHighScore', highScore);
    resultMsg += ` 🎉 New High Score!`;
    document.getElementById('high-score').textContent = `High Score: ${highScore}`;
  }

  document.getElementById('final-score').textContent = resultMsg;

// ✅ Save to backend
  fetch('https://logic-word-puzzle.onrender.com/api/submit-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: playerName, score: score })
  })
  .then(response => response.json())
  .then(data => {
    console.log("Score saved:", data);
  })
  .catch(err => {
    console.error("Failed to save score:", err);
  });
}
function restartGame() {
  clickSound.currentTime = 0;
  clickSound.play();
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('level-screen').classList.remove('hidden');

  // Reset game state
  words = [];
  currentIndex = 0;
  score = 0;
  timeLeft = 20;
  document.getElementById('score').textContent = 'Score: 0';
  document.getElementById('timer').textContent = 'Time: 20';
  document.getElementById('user-input').value = '';
  document.getElementById('scrambled-word').textContent = '_ _ _';
  document.getElementById('feedback').textContent = '';
  document.getElementById('next-btn').classList.add('hidden');
  
  const hint = document.getElementById('hint');
  if (hint) hint.textContent = '';
}

let highScore = localStorage.getItem('wordPuzzleHighScore') || 0;
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('high-score').textContent = `High Score: ${highScore}`;
});

function startDailyChallenge() {
  const categories = ['bible', 'math', 'code', 'memory', 'daily', 'grammar'];
  const levels = ['beginner', 'easy', 'medium', 'hard', 'expert'];
  const today = new Date().toISOString().split('T')[0];

  const lastPlayed = localStorage.getItem('lastDailyPlayed');
  if (lastPlayed === today) {
    alert("You've already played today's challenge. Come back tomorrow!");
    return;
  }

  // Deterministically choose based on date
  const seed = new Date().getFullYear() + new Date().getMonth() + new Date().getDate();
  const category = categories[seed % categories.length];
  const level = levels[seed % levels.length];

  localStorage.setItem('lastDailyPlayed', today);
  localStorage.setItem('dailyChallenge', `${category}-${level}`);

  alert(`🗓️ Today's Challenge: ${category.toUpperCase()} - ${level.toUpperCase()}`);
  startGame(category, level, true); // Pass isDaily = true
}

function shuffleArray(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

function addAdminWord() {
  const level = document.getElementById('admin-level').value;
  const newWord = document.getElementById('admin-word').value.trim().toLowerCase();

  if (!newWord) {
    document.getElementById('admin-feedback').textContent = 'Please enter a word.';
    return;
  }

  // Get existing from localStorage or fallback to empty array
  const storedWords = JSON.parse(localStorage.getItem('customWords')) || {};

  if (!storedWords[level]) {
    storedWords[level] = [];
  }

  if (storedWords[level].includes(newWord)) {
    document.getElementById('admin-feedback').textContent = 'Word already exists in this level.';
    return;
  }

  storedWords[level].push(newWord);
  localStorage.setItem('customWords', JSON.stringify(storedWords));

  document.getElementById('admin-feedback').textContent = `Added "${newWord}" to ${level}.`;
  document.getElementById('admin-word').value = '';
}
const ADMIN_PASSWORD = "Mainman"; // 🔒 You can change this

// Listen for secret key combo (Ctrl + A)
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key.toLowerCase() === "a") {
    promptAdminAccess();
    e.preventDefault();
  }
});

function promptAdminAccess() {
  const input = prompt("Enter Admin Password:");
  if (input === ADMIN_PASSWORD) {
    document.getElementById("admin-popup").classList.remove("hidden");
  } else {
    alert("Incorrect password. Access denied.");
  }
}

function logoutAdmin() {
  document.getElementById("admin-popup").classList.add("hidden");
  document.getElementById("admin-feedback").textContent = '';
}

function addAdminWord() {
  const level = document.getElementById('admin-level').value;
  const newWord = document.getElementById('admin-word').value.trim().toLowerCase();

  if (!newWord) {
    document.getElementById('admin-feedback').textContent = 'Please enter a word.';
    return;
  }

  const storedWords = JSON.parse(localStorage.getItem('customWords')) || {};

  if (!storedWords[level]) {
    storedWords[level] = [];
  }

  if (storedWords[level].includes(newWord)) {
    document.getElementById('admin-feedback').textContent = 'Word already exists in this level.';
    return;
  }

  storedWords[level].push(newWord);
  localStorage.setItem('customWords', JSON.stringify(storedWords));

  document.getElementById('admin-feedback').textContent = `✅ "${newWord}" added to ${level}`;
  document.getElementById('admin-word').value = '';
}
function openAdminPopup() {
  const password = prompt("Enter admin password:");
  if (password === ADMIN_PASSWORD) {  // ✅ Uses the defined global constant
    document.getElementById("admin-popup").classList.remove("hidden");
  } else {
    alert("Incorrect password. Access denied.");
  }
}

function closeAdminPopup() {
  document.getElementById("admin-popup").classList.add("hidden");
}

const levels = ["beginner", "easy", "medium", "hard", "expert"];

document.addEventListener("DOMContentLoaded", () => {
  const categoryButtons = document.querySelectorAll(".category-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      clickSound.currentTime = 0;
      clickSound.play();
      currentCategory = button.dataset.category;
      showLevelPopup();
    });
  });

  cancelBtn.addEventListener("click", () => {
    clickSound.currentTime = 0;
    clickSound.play();
    document.getElementById("level-popup").classList.add("hidden");
  });
});

  // Create level buttons dynamically
function showLevelPopup() {
  const levelPopup = document.getElementById("level-popup");
  const levelButtonsContainer = document.getElementById("level-buttons");

    levelButtonsContainer.innerHTML = ""; // Clear previous buttons

    levels.forEach(level => {
      const btn = document.createElement("button");
      btn.textContent = level.charAt(0).toUpperCase() + level.slice(1);
      btn.classList.add("level-btn");
      btn.onclick = () => {
        clickSound.currentTime = 0;
        clickSound.play();
        levelPopup.classList.add("hidden");
        startGame(currentCategory, level);
      };
      levelButtonsContainer.appendChild(btn);
    });
    levelPopup.classList.remove("hidden");
  }
function showHint() {
  clickSound.currentTime = 0;
  clickSound.play();
  if (coins < 1) {
    alert("Not enough coins for a hint!");
    return;
  }

  if (hintProgress >= currentWord.length) {
    document.getElementById('hint').textContent = '🔍 Full word already revealed.';
    return;
  }

  coins -= 1;
  hintProgress++;
  localStorage.setItem('puzzleCoins', coins);
  document.getElementById('coins').textContent = `Coins: ${coins}`;

  const partialHint = currentWord.slice(0, hintProgress) + "*".repeat(currentWord.length - hintProgress);
  document.getElementById('hint').textContent = `Hint: ${partialHint} (-1 coin)`;
}

function skipWord() {
  clickSound.currentTime = 0;
  clickSound.play();
  if (coins < 2) {
    alert("Not enough coins to skip!");
    return;
  }

  coins -= 2;
  localStorage.setItem('puzzleCoins', coins);
  document.getElementById('coins').textContent = `Coins: ${coins}`;

  clearInterval(timer);
  document.getElementById('feedback').textContent = `⏩ Skipped! Correct was: ${currentWord} (-2 coins)`;
  document.getElementById('next-btn').classList.remove('hidden');
}

// DEBUG: Force result screen to test if it shows
// showResult();
function showLeaderboard() {
  clickSound.currentTime = 0;
  clickSound.play();
  fetch('https://logic-word-puzzle.onrender.com/api/leaderboard')
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('leaderboard-list');
      list.innerHTML = '';
      data.forEach((entry, i) => {
        const li = document.createElement('li');
        li.textContent = `${i + 1}. ${entry.name} - ${entry.score}`;
        list.appendChild(li);
      });

      document.getElementById('result-screen').classList.add('hidden');
      document.getElementById('leaderboard-screen').classList.remove('hidden');
    });
}
let coins = parseInt(localStorage.getItem('puzzleCoins')) || 0;
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('high-score').textContent = `High Score: ${highScore}`;
  document.getElementById('coins').textContent = `Coins: ${coins}`;
});
let isMultiplayer = false;
let multiplayerData = {
  players: [],
  turn: 0,
  rounds: 5
};
function startMultiplayerMode() {
  const player1 = prompt("Enter Player 1 name:");
  const player2 = prompt("Enter Player 2 name:");

  if (!player1 || !player2) {
    alert("Both players must enter names.");
    return;
  }

  isMultiplayer = true;
  multiplayerData = {
    players: [
      { name: player1, score: 0 },
      { name: player2, score: 0 }
    ],
    turn: 0,
    rounds: 5
  };

  const categories = ['bible', 'math', 'code', 'memory', 'grammar'];
  currentCategory = categories[Math.floor(Math.random() * categories.length)];
  fetch('https://logic-word-puzzle.onrender.com/api/words')
    .then(res => res.json())
    .then(data => {
      const multiplayerLevels = ['medium', 'hard', 'expert'];
      const level = multiplayerLevels[Math.floor(Math.random() * multiplayerLevels.length)];
      const levelWords = data[currentCategory][level] || [];
      words = shuffleArray(levelWords).slice(0, multiplayerData.rounds * 2);
      currentIndex = 0;
      score = 0;

      document.getElementById('level-screen').classList.add('hidden');
      document.getElementById('game-screen').classList.remove('hidden');
      nextMultiplayerTurn();
    });
}
function nextMultiplayerTurn() {
  clickSound.currentTime = 0;
  clickSound.play();
  clearInterval(timer);
  timeLeft = 30;
  document.getElementById('user-input').value = '';
  document.getElementById('hint').textContent = '';
  document.getElementById('feedback').textContent = '';
  document.getElementById('next-btn').classList.add('hidden');

  if (multiplayerData.turn >= multiplayerData.players.length * multiplayerData.rounds) {
    return showMultiplayerResult();
  }

  const currentPlayer = multiplayerData.players[multiplayerData.turn % 2];
  currentWord = words[multiplayerData.turn];
  scrambled = scramble(currentWord);

  document.getElementById('level-name').textContent = `👤 ${currentPlayer.name}'s Turn`;
  document.getElementById('scrambled-word').textContent = scrambled;
  document.getElementById('score').textContent = `Score: ${currentPlayer.score}`;

  startTimer();
}
function showMultiplayerResult() {
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('result-screen').classList.remove('hidden');

  const [p1, p2] = multiplayerData.players;
  let result = `🏁 ${p1.name}: ${p1.score} vs ${p2.name}: ${p2.score}\n`;

  if (p1.score > p2.score) result += `🎉 ${p1.name} Wins!`;
  else if (p2.score > p1.score) result += `🎉 ${p2.name} Wins!`;
  else result += "🤝 It's a Tie!";

  document.getElementById('final-score').textContent = result;
  isMultiplayer = false; // Reset
}
const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const data = new FormData(form);
    const endpoint = "https://formspree.io/f/xvgqqpdl"; // Replace this

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        status.innerText = "✅ Message sent!";
        form.reset();
      } else {
        const errorData = await response.json();
        status.innerText = errorData.errors?.[0]?.message || "❌ Failed to send.";
      }
    } catch (error) {
      status.innerText = "❌ Error submitting form.";
    }
  });
  document.getElementById('scrambled-word').textContent = '⏳ Loading...';