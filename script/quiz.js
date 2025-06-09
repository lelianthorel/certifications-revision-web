const params = new URLSearchParams(window.location.search);
const ccna = params.get('ccna');
const module = params.get('module');

document.getElementById("quiz-title").innerHTML = `Quiz ${ccna.toUpperCase()} - ${module}`;

let questions = [];
let current = 0;
let total = 0;
let score = 0;
let wrongAnswers = [];
let selectedIndices = [];

const questionText = document.getElementById("question-text");
const questionImage = document.getElementById("question-image");
const choicesBox = document.getElementById("choices");
const resultBox = document.getElementById("result-box");
const feedback = document.getElementById("feedback");
const progress = document.getElementById("progress");
const recapBox = document.getElementById("recap-box");
const scoreText = document.getElementById("score-text");
const mistakeList = document.getElementById("mistake-list");
const quizSection = document.getElementById("quiz-section");

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

fetch(`https://ccna-revision.fr/data/${ccna}/${module}.json`)
  .then(res => res.json())
  .then(data => {
    questions = data;
    shuffleArray(questions);
    total = questions.length;
    loadQuestion();
  })
  .catch(() => {
    document.getElementById("quiz-title").textContent = "Erreur de chargement";
    questionText.textContent = "Impossible de charger les questions. Veuillez réessayer.";
    const retryButton = document.createElement("button");
    retryButton.textContent = "Réessayer";
    retryButton.className = "btn btn-warning";
    retryButton.onclick = () => location.reload();
    questionText.appendChild(retryButton);
  });

function loadQuestion() {
  const q = questions[current];
  selectedIndices = [];
  questionText.innerHTML = q.question;
  choicesBox.innerHTML = "";
  resultBox.classList.add("d-none");

  // Affichage conditionnel de l'image
  console.log(q);
  if (q.image) {
    questionImage.src = q.image;
    questionImage.classList.remove("d-none");
  } else {
    questionImage.src = "";
    questionImage.classList.add("d-none");
  }

  q.choices.forEach((choice, index) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-secondary choice-btn";
    btn.innerHTML = choice;
    btn.dataset.index = index;
    btn.onclick = () => toggleSelect(btn);
    choicesBox.appendChild(btn);
  });

  progress.textContent = `Question ${current + 1} sur ${total}`;
}

function toggleSelect(button) {
  const index = parseInt(button.dataset.index);
  const correctCount = questions[current].answers.length;

  if (correctCount === 1) {
    selectedIndices = [index];
    checkAnswer();
  } else {
    if (selectedIndices.includes(index)) {
      selectedIndices = selectedIndices.filter(i => i !== index);
      button.classList.remove("active");
    } else {
      selectedIndices.push(index);
      button.classList.add("active");
    }

    if (selectedIndices.length === correctCount) {
      checkAnswer();
    }
  }
}

function checkAnswer() {
  const correctAnswers = questions[current].answers.sort();
  const userAnswers = [...selectedIndices].sort();

  const allButtons = document.querySelectorAll(".choice-btn");

  allButtons.forEach(btn => {
    btn.disabled = true;
    const idx = parseInt(btn.dataset.index);
    if (correctAnswers.includes(idx)) btn.classList.add("correct");
    if (userAnswers.includes(idx) && !correctAnswers.includes(idx)) btn.classList.add("wrong");
  });

  const isCorrect = JSON.stringify(correctAnswers) === JSON.stringify(userAnswers);

  if (isCorrect) {
    feedback.textContent = "✅ Bonne réponse !";
    feedback.className = "text-success";
    score++;
  } else {
    feedback.textContent = "❌ Mauvaise réponse.";
    feedback.className = "text-danger";
    const givenLabels = userAnswers.map(i => questions[current].choices[i]);
    const correctLabels = correctAnswers.map(i => questions[current].choices[i]);
    wrongAnswers.push({
      question: questions[current].question,
      given: givenLabels.join(', '),
      correct: correctLabels.join(', ')
    });
  }

  resultBox.classList.remove("d-none");
}

function nextQuestion() {
  current++;
  if (current < total) {
    loadQuestion();
  } else {
    showRecap();
  }
}

function showRecap() {
  quizSection.classList.add("d-none");
  recapBox.classList.remove("d-none");
  scoreText.textContent = `Tu as eu ${score} bonne${score > 1 ? 's' : ''} sur ${total}.`;

  if (wrongAnswers.length > 0) {
    const list = document.createElement("ul");
    list.className = "list-group mt-3";

    wrongAnswers.forEach(item => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.innerHTML = `
        <strong>Question :</strong> ${item.question}<br>
        <span class="text-danger"><strong>Ta réponse :</strong> ${item.given}</span><br>
        <span class="text-success"><strong>Bonne réponse :</strong> ${item.correct}</span>
      `;
      list.appendChild(li);
    });

    mistakeList.innerHTML = `<h5 class="mt-4">❌ Questions ratées :</h5>`;
    mistakeList.appendChild(list);
  } else {
    mistakeList.innerHTML = `<p class="text-success mt-3">Aucune erreur ! 🎉</p>`;
  }
}

function restartQuiz() {
  current = 0;
  score = 0;
  wrongAnswers = [];
  shuffleArray(questions);
  loadQuestion();
  recapBox.classList.add("d-none");
  quizSection.classList.remove("d-none");
}

document.addEventListener("keydown", function (e) {
  if ((e.code === "Space" || e.key === " ") && !resultBox.classList.contains("d-none")) {
    e.preventDefault();
    nextQuestion();
  }
});