const PASSWORD = "kissmunamgatatlongbeses";
const bank = window.CYRA_QUESTION_BANK;
let glossary = window.CYRA_GLOSSARY;
const studyGuide = window.CYRA_STUDY_GUIDE;

const quests = [
  {
    id: "area-b",
    title: "Area B Systems Quest",
    source: "Area B",
    count: 20,
    description: "Building technology, utilities, structural parts, materials, and construction recognition.",
    filter: (question) => question.area === "Area B",
  },
  {
    id: "area-c",
    title: "Area C Planning Quest",
    source: "Area C",
    count: 20,
    description: "Architecture and site planning items from codes, zoning, accessibility, and space planning.",
    filter: (question) => question.area === "Area C",
  },
  {
    id: "combined",
    title: "Combined Review Quest",
    source: "Area B + C",
    count: 30,
    description: "A mixed run that forces fast switching between systems, code numbers, and planning logic.",
    filter: () => true,
  },
  {
    id: "numbers",
    title: "Code Numbers Sprint",
    source: "Standards",
    count: 15,
    description: "A focused sprint for dimensions, distances, ratings, areas, slopes, and quantified rules.",
    filter: (question) => /\b\d|meter|mm|sqm|sq\.m|%|hour|ratio|slope|slots/i.test(question.question + " " + Object.values(question.options).join(" ")),
  },
  {
    id: "final",
    title: "Final Boss Mock Quest",
    source: "Full bank",
    count: 50,
    description: "The longer mock quiz. Take this after the separate Area B and Area C quests feel steady.",
    filter: () => true,
  },
];

let activeQuest = null;
let activeQuestions = [];
let activeIndex = 0;
let score = 0;
let answered = false;
let flashIndex = 0;
let flashShowingAnswer = false;

const gate = document.querySelector("#passwordGate");
const appShell = document.querySelector("#appShell");
const sidebar = document.querySelector("#sidebar");
const sidebarToggle = document.querySelector("#sidebarToggle");
const passwordForm = document.querySelector("#passwordForm");
const passwordInput = document.querySelector("#passwordInput");
const gateError = document.querySelector("#gateError");
const togglePassword = document.querySelector("#togglePassword");
const pageLinks = document.querySelectorAll("[data-page-link]");
const pageSections = document.querySelectorAll("[data-page]");

const defaultPage = "study";
const pageIds = [...pageSections].map((section) => section.dataset.page);

function getPageFromHash() {
  const hash = window.location.hash.replace("#", "");
  return pageIds.includes(hash) ? hash : defaultPage;
}

function showPage(pageId, options = {}) {
  const nextPage = pageIds.includes(pageId) ? pageId : defaultPage;
  pageSections.forEach((section) => {
    const isActive = section.dataset.page === nextPage;
    section.classList.toggle("active", isActive);
    section.toggleAttribute("hidden", !isActive);
  });
  pageLinks.forEach((link) => {
    const isActive = link.dataset.pageLink === nextPage;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
  if (window.location.hash !== `#${nextPage}`) {
    history.replaceState(null, "", `#${nextPage}`);
  }
  if (options.scroll !== false) {
    window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });
  }
}

function setSidebarCollapsed(collapsed) {
  appShell.classList.toggle("sidebar-collapsed", collapsed);
  sidebar.classList.toggle("collapsed", collapsed);
  sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
  sidebarToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  localStorage.setItem("cyraSidebarCollapsed", collapsed ? "true" : "false");
}

function unlock() {
  document.body.classList.remove("locked");
  gate.classList.add("hidden");
  appShell.removeAttribute("aria-hidden");
  sessionStorage.setItem("cyraUnlocked", "true");
}

if (sessionStorage.getItem("cyraUnlocked") === "true") {
  unlock();
} else {
  setTimeout(() => passwordInput.focus(), 100);
}

passwordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (passwordInput.value.trim() === PASSWORD) {
    gateError.textContent = "";
    unlock();
  } else {
    gateError.textContent = "Password is incorrect. Please try again.";
    passwordInput.select();
  }
});

togglePassword.addEventListener("click", () => {
  const showing = passwordInput.type === "text";
  passwordInput.type = showing ? "password" : "text";
  togglePassword.textContent = showing ? "Show" : "Hide";
});

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showPage(link.dataset.pageLink);
  });
});

window.addEventListener("hashchange", () => {
  showPage(getPageFromHash(), { instant: true });
});

sidebarToggle.addEventListener("click", () => {
  setSidebarCollapsed(!appShell.classList.contains("sidebar-collapsed"));
});

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function sampleQuestions(quest) {
  const pool = bank.questions.filter(quest.filter);
  return shuffle(pool).slice(0, Math.min(quest.count, pool.length));
}

function saveQuestProgress(questId, questScore, total) {
  const progress = JSON.parse(localStorage.getItem("cyraQuestProgress") || "{}");
  const previous = progress[questId];
  if (!previous || questScore > previous.score || total !== previous.total) {
    progress[questId] = { score: questScore, total, date: new Date().toISOString() };
    localStorage.setItem("cyraQuestProgress", JSON.stringify(progress));
  }
  renderQuests();
}

function getQuestProgress() {
  return JSON.parse(localStorage.getItem("cyraQuestProgress") || "{}");
}

function renderStudyGuide() {
  document.querySelector("#studyGrid").innerHTML = studyGuide.map((item) => `
    <article class="study-card">
      <h4>${item.title}</h4>
      <p>${item.body}</p>
      <ul>${item.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>
    </article>
  `).join("");
}

function renderQuests() {
  const progress = getQuestProgress();
  document.querySelector("#questGrid").innerHTML = quests.map((quest) => {
    const poolCount = bank.questions.filter(quest.filter).length;
    const saved = progress[quest.id];
    const savedText = saved ? `Best ${saved.score}/${saved.total}` : "Not cleared yet";
    return `
      <article class="quest-card">
        <p class="eyebrow">${quest.source}</p>
        <h4>${quest.title}</h4>
        <p>${quest.description}</p>
        <div class="quest-stats">
          <span>${quest.count} items</span>
          <span>${poolCount} pool</span>
          <span>${savedText}</span>
        </div>
        <button class="primary-button" data-quest="${quest.id}">Start quest</button>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-quest]").forEach((button) => {
    button.addEventListener("click", () => startQuest(button.dataset.quest));
  });
}

function startQuest(questId) {
  showPage("quests", { scroll: false });
  activeQuest = quests.find((quest) => quest.id === questId);
  activeQuestions = sampleQuestions(activeQuest);
  activeIndex = 0;
  score = 0;
  answered = false;
  document.querySelector("#quizPanel").classList.remove("hidden");
  document.querySelector("#quizPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  renderQuestion();
}

function renderQuestion() {
  const question = activeQuestions[activeIndex];
  answered = false;

  document.querySelector("#quizQuestLabel").textContent = activeQuest.source;
  document.querySelector("#quizTitle").textContent = activeQuest.title;
  document.querySelector("#quizMeta").textContent = `Question ${activeIndex + 1} of ${activeQuestions.length} - Score ${score}/${activeQuestions.length}`;
  document.querySelector("#quizProgressBar").style.width = `${(activeIndex / activeQuestions.length) * 100}%`;
  document.querySelector("#questionTopic").textContent = `${question.area} - ${question.topic}`;
  document.querySelector("#questionText").textContent = question.question;

  const optionsList = document.querySelector("#optionsList");
  optionsList.innerHTML = Object.entries(question.options).map(([letter, value]) => `
    <button class="option-button" data-option="${letter}">
      <span class="option-letter">${letter}</span>${value}
    </button>
  `).join("");

  document.querySelector("#feedbackBox").className = "feedback hidden";
  document.querySelector("#feedbackBox").innerHTML = "";
  document.querySelector("#nextQuestion").disabled = true;
  document.querySelector("#nextQuestion").textContent = activeIndex === activeQuestions.length - 1 ? "Finish quest" : "Next question";

  optionsList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => answerQuestion(button.dataset.option));
  });
}

function answerQuestion(choice) {
  if (answered) return;
  answered = true;

  const question = activeQuestions[activeIndex];
  const isCorrect = choice === question.answer;
  if (isCorrect) score += 1;

  document.querySelectorAll(".option-button").forEach((button) => {
    button.disabled = true;
    if (button.dataset.option === question.answer) button.classList.add("correct");
    if (button.dataset.option === choice && !isCorrect) button.classList.add("wrong");
  });

  const feedback = document.querySelector("#feedbackBox");
  feedback.className = `feedback ${isCorrect ? "correct" : "wrong"}`;
  feedback.innerHTML = `
    <strong>${isCorrect ? "Correct." : "Not quite."} Answer: ${question.answer}. ${question.options[question.answer]}</strong>
    <p>${question.explanation || "Review the question stem and match it to the exact standard or system being described."}</p>
  `;

  document.querySelector("#quizMeta").textContent = `Question ${activeIndex + 1} of ${activeQuestions.length} - Score ${score}/${activeQuestions.length}`;
  document.querySelector("#nextQuestion").disabled = false;
}

document.querySelector("#nextQuestion").addEventListener("click", () => {
  if (activeIndex < activeQuestions.length - 1) {
    activeIndex += 1;
    renderQuestion();
    return;
  }

  document.querySelector("#quizProgressBar").style.width = "100%";
  saveQuestProgress(activeQuest.id, score, activeQuestions.length);
  document.querySelector("#feedbackBox").className = "feedback";
  document.querySelector("#feedbackBox").innerHTML = `
    <strong>Quest complete: ${score}/${activeQuestions.length}</strong>
    <p>${score === activeQuestions.length ? "Clean run. You cleared this quest." : "Retake this quest after reviewing the missed topics and the glossary cards."}</p>
  `;
  document.querySelector("#nextQuestion").disabled = true;
});

document.querySelector("#closeQuiz").addEventListener("click", () => {
  document.querySelector("#quizPanel").classList.add("hidden");
});

document.querySelector("#resetProgress").addEventListener("click", () => {
  localStorage.removeItem("cyraQuestProgress");
  renderQuests();
});

function renderFlashcard() {
  const card = glossary[flashIndex];
  const sources = card.sources && card.sources.length ? card.sources.slice(0, 3).join(" | ") : card.tag;
  const flashcard = document.querySelector("#flashcard");
  flashcard.classList.toggle("flipped", flashShowingAnswer);
  document.querySelector("#flashcardTag").textContent = card.tag;
  document.querySelector("#flashcardTerm").textContent = card.term;
  document.querySelector("#flashcardPrompt").textContent = "Think through the meaning, then flip to check the answer.";
  document.querySelector("#flashcardBackTag").textContent = card.tag;
  document.querySelector("#flashcardBackTerm").textContent = card.term;
  document.querySelector("#flashcardDefinition").textContent = card.definition;
  document.querySelector("#flashcardSource").textContent = `Source: ${sources}`;
  document.querySelector("#flashHint").textContent = `${flashIndex + 1}/${glossary.length}`;
}

function flipFlashcard() {
  flashShowingAnswer = !flashShowingAnswer;
  renderFlashcard();
}

function moveFlashcard(step) {
  flashShowingAnswer = false;
  flashIndex = (flashIndex + step + glossary.length) % glossary.length;
  animateFlashcardChange();
  renderFlashcard();
}

function animateFlashcardChange() {
  const flashcard = document.querySelector("#flashcard");
  flashcard.classList.remove("is-changing");
  void flashcard.offsetWidth;
  flashcard.classList.add("is-changing");
}

document.querySelector("#flashcard").addEventListener("click", flipFlashcard);
document.querySelector("#flashcard").addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    flipFlashcard();
  }
});
document.querySelector("#flipCard").addEventListener("click", flipFlashcard);
document.querySelector("#prevCard").addEventListener("click", () => moveFlashcard(-1));
document.querySelector("#nextCard").addEventListener("click", () => moveFlashcard(1));
document.querySelector("#shuffleCards").addEventListener("click", () => {
  glossary = shuffle(glossary);
  flashIndex = 0;
  flashShowingAnswer = false;
  animateFlashcardChange();
  renderFlashcard();
});

function renderGlossary() {
  const query = document.querySelector("#glossarySearch").value.trim().toLowerCase();
  const filtered = glossary.filter((item) => `${item.term} ${item.tag} ${item.definition} ${(item.sources || []).join(" ")}`.toLowerCase().includes(query));
  document.querySelector("#glossaryGrid").innerHTML = filtered.map((item) => `
    <article class="glossary-card">
      <p class="topic-pill">${item.tag}</p>
      <h4>${item.term}</h4>
      <p>${item.definition}</p>
      <p class="source-line">${item.sources && item.sources.length ? item.sources.slice(0, 4).join(" | ") : item.tag}</p>
    </article>
  `).join("");
}

document.querySelector("#glossarySearch").addEventListener("input", renderGlossary);

function renderBankSummary() {
  const value = document.querySelector("#bankFilter").value;
  const selected = value === "all" ? bank.questions : bank.questions.filter((question) => question.area === value);
  const byTopic = selected.reduce((accumulator, question) => {
    accumulator[question.topic] = (accumulator[question.topic] || 0) + 1;
    return accumulator;
  }, {});
  const areaCounts = selected.reduce((accumulator, question) => {
    accumulator[question.area] = (accumulator[question.area] || 0) + 1;
    return accumulator;
  }, {});

  document.querySelector("#bankSummary").innerHTML = `
    <article class="bank-card">
      <h4>${selected.length} questions selected</h4>
      <p>Area spread: ${Object.entries(areaCounts).map(([area, count]) => `${area}: ${count}`).join(" - ")}</p>
      <ul class="bank-list">
        ${Object.entries(byTopic).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([topic, count]) => `<li>${topic}: ${count}</li>`).join("")}
      </ul>
    </article>
    <article class="bank-card">
      <h4>Sources</h4>
      <p>Area B was extracted from Set B with answer.docx. Area C was extracted from Set C without answer.docx and matched to set c answer_key.md.</p>
      <p>Question pools are randomized every time a quest starts.</p>
    </article>
  `;
}

document.querySelector("#bankFilter").addEventListener("change", renderBankSummary);

document.querySelector("#totalQuestions").textContent = bank.questions.length;
document.querySelector("#glossaryCount").textContent = glossary.length;
document.querySelector("#flashcardCount").textContent = glossary.length;

renderStudyGuide();
renderQuests();
renderFlashcard();
renderGlossary();
renderBankSummary();
setSidebarCollapsed(localStorage.getItem("cyraSidebarCollapsed") === "true");
showPage(getPageFromHash(), { instant: true, scroll: false });
