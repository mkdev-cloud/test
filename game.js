// Game state
let timeLeft = 180;
let score = 0;
let timerInterval = null;
let draggedItem = null;
let arrangedSteps = [];

const correctSteps = [
  { id: 1, title: "Application", description: "Buyer applies for LC with issuing bank", phase: "initiation" },
  { id: 2, title: "Issuance", description: "Issuing bank issues LC to seller", phase: "initiation" },
  { id: 3, title: "Advising", description: "Advising bank notifies seller of LC terms", phase: "initiation" },
  { id: 4, title: "Shipment", description: "Seller ships goods according to LC terms", phase: "execution" },
  { id: 5, title: "Document Preparation", description: "Seller prepares required documents", phase: "execution" },
  { id: 6, title: "Document Presentation", description: "Seller presents documents to advising bank", phase: "execution" },
  { id: 7, title: "Document Examination", description: "Banks examine documents for compliance", phase: "settlement" },
  { id: 8, title: "Payment", description: "Payment made upon document compliance", phase: "settlement" },
  { id: 9, title: "Document Delivery", description: "Documents delivered to buyer for goods release", phase: "settlement" }
];

const discrepancyChallenges = [
  {
    document: "Commercial Invoice",
    correctValue: "USD 50,000",
    incorrectValue: "USD 55,000",
    explanation: "Invoice amount exceeds LC amount limit"
  },
  {
    document: "Bill of Lading",
    correctValue: "Hamburg Port",
    incorrectValue: "Bremen Port",
    explanation: "Port doesn't match LC specifications"
  },
  {
    document: "Insurance Certificate",
    correctValue: "110% of Invoice Value",
    incorrectValue: "100% of Invoice Value",
    explanation: "Insurance coverage below required 110%"
  }
];

function startGame() {
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  arrangedSteps = [];
  score = 0;
  timeLeft = 180;
  updateScore();
  updateTimerDisplay();
  startTimer();
  loadShuffledSteps();
}

function endGame() {
  clearInterval(timerInterval);
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('completed-screen').classList.remove('hidden');
  document.getElementById('final-score').textContent = `Your Score: ${score}`;
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  document.getElementById('timer').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateScore() {
  document.getElementById('score').textContent = `Score: ${score}`;
}

function loadShuffledSteps() {
  const shuffled = [...correctSteps].sort(() => Math.random() - 0.5);
  const container = document.getElementById('shuffled-steps');
  container.innerHTML = '';
  shuffled.forEach(step => {
    const div = createStepCard(step);
    div.setAttribute('draggable', 'true');
    div.addEventListener('dragstart', e => {
      draggedItem = step;
    });
    container.appendChild(div);
  });

  document.getElementById('arranged-steps').innerHTML = '';
}

function createStepCard(step) {
  const div = document.createElement('div');
  div.className = `step-card ${step.phase}`;
  div.textContent = `${step.title}: ${step.description}`;
  div.dataset.id = step.id;
  return div;
}

function setupDropZones() {
  const shuffledZone = document.getElementById('shuffled-steps');
  const arrangedZone = document.getElementById('arranged-steps');

  [shuffledZone, arrangedZone].forEach(zone => {
    zone.addEventListener('dragover', e => e.preventDefault());
    zone.addEventListener('drop', e => {
      e.preventDefault();
      if (!draggedItem) return;

      const zoneId = zone.id;
      const draggedDiv = createStepCard(draggedItem);
      draggedDiv.setAttribute('draggable', 'true');
      draggedDiv.addEventListener('dragstart', e => {
        draggedItem = correctSteps.find(s => s.id == draggedDiv.dataset.id);
      });

      if (zoneId === 'arranged-steps') {
        arrangedSteps.push(draggedItem);
        zone.appendChild(draggedDiv);
        document.querySelector(`#shuffled-steps div[data-id='${draggedItem.id}']`)?.remove();
      } else {
        arrangedSteps = arrangedSteps.filter(s => s.id !== draggedItem.id);
        zone.appendChild(draggedDiv);
        document.querySelector(`#arranged-steps div[data-id='${draggedItem.id}']`)?.remove();
      }

      if (arrangedSteps.length === correctSteps.length) {
        checkArrangement();
      }

      draggedItem = null;
    });
  });
}

function checkArrangement() {
  const correct = arrangedSteps.every((step, index) => step.id === correctSteps[index].id);
  if (correct) {
    const timeBonus = Math.floor(timeLeft / 10);
    score += 1000 + timeBonus;
    updateScore();
    showDiscrepancyChallenge();
  }
}

function showDiscrepancyChallenge() {
  const random = discrepancyChallenges[Math.floor(Math.random() * discrepancyChallenges.length)];
  document.getElementById('discrepancy-modal').classList.remove('hidden');
  document.getElementById('discrepancy-question').innerHTML =
    `<strong>${random.document}</strong><br>Expected: ${random.correctValue}<br>Found: ${random.incorrectValue}`;
  document.getElementById('submit-discrepancy').onclick = function () {
    const answer = document.getElementById('discrepancy-answer').value.toLowerCase();
    if (answer.includes("discrepancy") || answer.includes("error") || answer.includes("incorrect")) {
      score += 500;
    } else {
      score = Math.max(0, score - 100);
    }
    updateScore();
    document.getElementById('discrepancy-modal').classList.add('hidden');
    endGame();
  };
}

// Event bindings
document.getElementById('start-game').onclick = startGame;
document.getElementById('play-again').onclick = () => {
  document.getElementById('completed-screen').classList.add('hidden');
  document.getElementById('menu-screen').classList.remove('hidden');
};
document.getElementById('restart-game').onclick = () => location.reload();

window.onload = () => {
  setupDropZones();
};
