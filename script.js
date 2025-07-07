/* ───────── Firebase imports ───────── */
import {
  signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

/* global objects created in index.html */
const auth     = window.firebaseAuth;
const provider = window.GoogleProvider;
const db       = getFirestore();

/* ───────── Auth UI ───────── */
const loginBtn  = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userSpan  = document.getElementById("userInfo");

loginBtn .addEventListener("click", () => signInWithPopup(auth, provider));
logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async user => {
  updateAuthUI(user);

  if (user) await loadFromFirestore(user.uid);
  else      initFromLocal();

  resumeActiveSession();                // pick up an unfinished timer, if any
});

/* helper */
function updateAuthUI(user) {
  const logged = !!user;
  loginBtn.hidden  = logged;
  logoutBtn.hidden = !logged;
  userSpan.hidden  = !logged;
  userSpan.textContent = logged ? `👋 ${user.displayName}` : "";
}

/* ───────── App state ───────── */
let goals = [];
let currentGoalId;

let isSessionActive = false;
let sessionStartTime = 0, sessionInterval;

let isPomodoroActive = false, isBreakTime = false;
let pomodoroTimeLeft = 0, pomodoroInterval;

const POMODORO_DURATION = 25 * 60;      // 25 min
const BREAK_DURATION    = 5  * 60;      // 5 min

/* ───────── DOM refs ───────── */
const $ = id => document.getElementById(id);

const goalHeader     = $("goalHeader");
const startStopBtn   = $("startStopBtn");
const sessionTimer   = $("sessionTimer");
const totalLeaguesEl = $("totalLeagues");
const progressBar    = $("progressBar");
const logsBox        = $("logs");

const goalSel     = $("goalSelector");
const newGoalBtn  = $("newGoalBtn");
const editGoalBtn = $("editGoalBtn");
const delGoalBtn  = $("deleteGoalBtn");
const resetBtn    = $("resetEverythingBtn");

const bg = document.querySelector(".background");

const pomState     = $("pomodoroState");
const pomTimer     = $("pomodoroTimer");
const startPomBtn  = $("startPomodoroBtn");
const stopPomBtn   = $("stopPomodoroBtn");
const breakBtn     = $("takeBreakBtn");
const backBtn      = $("backToWorkBtn");

/* ───────── Initial load for signed-out users ───────── */
function initFromLocal() {
  goals         = JSON.parse(localStorage.getItem("goals")) || [];
  currentGoalId = localStorage.getItem("currentGoalId");

  if (!goals.length) createGoal("My First Goal");
  if (!currentGoalId) currentGoalId = goals[0].id;

  refreshUI();
}

/* ───────── Firestore load/save ───────── */
async function loadFromFirestore(uid) {
  const ref  = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data  = snap.data();
    goals         = data.goals || [];
    currentGoalId = data.currentGoalId || (goals[0]?.id);
  } else {
    // first login → migrate any local data (if present) or create starter goal
    goals         = JSON.parse(localStorage.getItem("goals")) || [];
    currentGoalId = localStorage.getItem("currentGoalId");
    if (!goals.length)       createGoal("My First Goal");
    if (!currentGoalId)      currentGoalId = goals[0].id;
    await setDoc(ref, { goals, currentGoalId });
  }

  refreshUI();
}

function saveGoals() {
  if (auth.currentUser) {
    setDoc(doc(db, "users", auth.currentUser.uid),
           { goals, currentGoalId }, { merge: true });
  } else {
    localStorage.setItem("goals",         JSON.stringify(goals));
    localStorage.setItem("currentGoalId", currentGoalId);
  }
}

/* ───────── Goal helpers ───────── */
function createGoal(name) {
  const g = { id: Date.now().toString(), name, totalTime: 0, logs: [] };
  goals.push(g);
  return g;
}
const ensureGoalExists = () => {
  if (!goals.length) {
    const g = createGoal("My First Goal");
    currentGoalId = g.id;
  }
};
function currentGoal() { return goals.find(g => g.id === currentGoalId); }

/* ───────── UI refresh helpers ───────── */
function refreshUI() {
  populateGoalSelector();
  updateGoalDisplay();
  renderLogs();
}

function populateGoalSelector() {
  goalSel.innerHTML = "";
  goals.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    goalSel.appendChild(opt);
  });
  goalSel.value = currentGoalId;
}

function updateGoalDisplay() {
  const g = currentGoal();
  if (!g) return;                         // should not happen, but safe

  goalHeader.textContent     = g.name;
  totalLeaguesEl.textContent = `Leagues Walked: ${toLeagues(g.totalTime)}`;
  progressBar.style.width    = `${Math.min(g.totalTime / 72000 * 100, 100)}%`;
}

/* ───────── Session timer ───────── */
function toggleSession() {
  ensureGoalExists();
  if (!currentGoal()) return alert("Please create/select a goal first.");

  isSessionActive = !isSessionActive;
  isSessionActive ? startSession() : stopSession();
}

function startSession() {
  sessionStartTime = Date.now();
  localStorage.setItem("activeSession", JSON.stringify({
    goalId: currentGoalId,
    startTime: sessionStartTime
  }));

  sessionInterval  = setInterval(updateSessionTimer, 1000);
  startStopBtn.textContent = "Stop";
  bg.classList.add("walking");
}

function updateSessionTimer() {
  const sec = Math.floor((Date.now() - sessionStartTime) / 1000);
  sessionTimer.textContent = fmt(sec);

  const g = currentGoal();
  totalLeaguesEl.textContent =
    `Leagues Walked: ${toLeagues(g.totalTime + sec)}`;
  progressBar.style.width =
    `${Math.min((g.totalTime + sec) / 72000 * 100, 100)}%`;
}

function stopSession() {
  clearInterval(sessionInterval);

  const secs = Math.floor((Date.now() - sessionStartTime) / 1000);
  const note = prompt("What did you accomplish?");

  if (secs > 0) {
    const g = currentGoal();
    g.totalTime += secs;
    g.logs.push({
      timestamp: new Date().toLocaleString(),
      duration:  secs,
      accomplishment: note || ""
    });
    saveGoals();                           // persist
  }

  renderLogs();
  updateGoalDisplay();

  // reset UI
  localStorage.removeItem("activeSession");
  sessionTimer.textContent = "00:00:00";
  startStopBtn.textContent = "Start";
  bg.classList.remove("walking");
  isSessionActive = false;
}

function resumeActiveSession() {
  const data = JSON.parse(localStorage.getItem("activeSession") || "null");
  if (!data) return;

  const g = goals.find(x => x.id === data.goalId);
  if (!g) return localStorage.removeItem("activeSession");  // stale

  currentGoalId    = g.id;
  sessionStartTime = data.startTime;
  isSessionActive  = true;

  sessionInterval  = setInterval(updateSessionTimer, 1000);
  startStopBtn.textContent = "Stop";
  bg.classList.add("walking");
  updateSessionTimer();                     // immediate paint
}

/* ───────── Pomodoro timer ───────── */
function startPomodoro() {
  if (isPomodoroActive) return;
  isPomodoroActive = true;
  isBreakTime      = false;
  pomodoroTimeLeft = POMODORO_DURATION;

  updatePomodoroUI();
  pomodoroInterval = setInterval(updatePomodoroTimer, 1000);
}
function startBreak() {
  if (!isPomodoroActive || isBreakTime) return;
  isBreakTime      = true;
  pomodoroTimeLeft = BREAK_DURATION;
  updatePomodoroUI();
}
function resumeWork() {
  if (!isPomodoroActive || !isBreakTime) return;
  isBreakTime      = false;
  pomodoroTimeLeft = POMODORO_DURATION;
  updatePomodoroUI();
}
function stopPomodoro() {
  clearInterval(pomodoroInterval);
  isPomodoroActive = false;
  isBreakTime      = false;
  pomodoroTimeLeft = 0;

  pomTimer.textContent = "25:00";
  updatePomodoroUI();
}

/* every second */
function updatePomodoroTimer() {
  pomodoroTimeLeft--;
  if (pomodoroTimeLeft <= 0) {
    if (!isBreakTime) {
      alert("Great work! Time for a 5-minute break.");
      startBreak();
    } else {
      alert("Break over. Ready for the next Pomodoro!");
      stopPomodoro();
      return;
    }
  }
  updatePomodoroUI();
}

function updatePomodoroUI() {
  const m = Math.floor(pomodoroTimeLeft / 60);
  const s = pomodoroTimeLeft % 60;
  pomTimer.textContent = `${pad(m)}:${pad(s)}`;

  pomState.textContent = !isPomodoroActive
    ? "Inactive"
    : isBreakTime ? "Break" : "Focus";

  startPomBtn.style.display = isPomodoroActive ? "none" : "inline-block";
  stopPomBtn .style.display = isPomodoroActive ? "inline-block" : "none";
  breakBtn   .style.display = (isPomodoroActive && !isBreakTime)
                              ? "inline-block" : "none";
  backBtn    .style.display = (isPomodoroActive &&  isBreakTime)
                              ? "inline-block" : "none";
}

/* ───────── Logs ───────── */
function renderLogs() {
  logsBox.innerHTML = "";
  const g = currentGoal();

  if (!g || !g.logs.length) {
    logsBox.innerHTML = "<p>No logs yet. Start walking!</p>";
    return;
  }

  // newest first
  g.logs.slice().reverse().forEach(l => {
    const p = document.createElement("p");
    p.textContent =
      `${l.timestamp} – Walked ${toLeagues(l.duration)} – ${l.accomplishment}`;
    logsBox.appendChild(p);
  });
}

/* ───────── misc helpers ───────── */
const pad = n => n.toString().padStart(2, "0");
const fmt = s => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
};
const toLeagues = seconds => `${(seconds / 3600).toFixed(1)} Leagues`;

/* ───────── Event bindings ───────── */
startStopBtn.addEventListener("click", toggleSession);

goalSel.addEventListener("change", e => {
  currentGoalId = e.target.value;
  saveGoals();
  refreshUI();
});

newGoalBtn.addEventListener("click", () => {
  const name = prompt("New goal name:");
  if (!name) return;
  const g = createGoal(name);
  currentGoalId = g.id;
  saveGoals();
  refreshUI();
});
editGoalBtn.addEventListener("click", () => {
  const g = currentGoal();
  if (!g) return;
  const name = prompt("Rename goal:", g.name);
  if (name && name !== g.name) {
    g.name = name;
    saveGoals();
    refreshUI();
  }
});
delGoalBtn.addEventListener("click", () => {
  if (goals.length === 1)
    return alert("You need at least one goal.");
  if (!confirm("Delete this goal?")) return;

  goals = goals.filter(g => g.id !== currentGoalId);
  currentGoalId = goals[0].id;
  saveGoals();
  refreshUI();
});
resetBtn.addEventListener("click", () => {
  if (!confirm("Delete ALL goals and data?")) return;
  goals = [];
  currentGoalId = null;
  localStorage.clear();
  if (auth.currentUser)
    setDoc(doc(db, "users", auth.currentUser.uid), {}); // wipe remote doc
  location.reload();
});

/* Pomodoro buttons */
startPomBtn.addEventListener("click", startPomodoro);
stopPomBtn .addEventListener("click", stopPomodoro);
breakBtn   .addEventListener("click", startBreak);
backBtn    .addEventListener("click", resumeWork);
