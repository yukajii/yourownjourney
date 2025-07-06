/* ───────── Firebase imports ───────── */
import {
  signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  getFirestore, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

/* global objects created in index.html */
const auth = window.firebaseAuth;
const provider = window.GoogleProvider;
const db   = getFirestore();

/* ───────── Auth UI ───────── */
const loginBtn  = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userSpan  = document.getElementById("userInfo");

loginBtn .addEventListener("click", () => signInWithPopup(auth, provider));
logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  updateAuthUI(user);
  if (user) await loadFromFirestore(user.uid);
  else       initFromLocal();                // anonymous/offline use
});

/* helper */
function updateAuthUI(user) {
  const logged = !!user;
  loginBtn.hidden  = logged;
  logoutBtn.hidden = !logged;
  userSpan.hidden  = !logged;
  if (logged) userSpan.textContent = `👋 ${user.displayName}`;
  else        userSpan.textContent = "";
}

/* ───────── App state ───────── */
let goals = [];
let currentGoalId;
let isSessionActive = false, isSessionPaused = false;
let sessionStartTime = 0, sessionInterval;
let pomodoroInterval, isPomodoroActive = false, isBreakTime = false;
let pomodoroTimeLeft = 0, breakTimeLeft = 0;
const POMODORO_DURATION = 25 * 60, BREAK_DURATION = 5 * 60;

/* ───────── DOM refs (existing) ───────── */
const $ = id => document.getElementById(id);
const goalHeader = $("goalHeader"), startStopBtn = $("startStopBtn"),
      sessionTimer = $("sessionTimer"), totalTime = $("totalTime"),
      progressBar  = $("progressBar"), logsBox = $("logs"),
      goalSel = $("goalSelector"), newGoalBtn = $("newGoalBtn"),
      editGoalBtn = $("editGoalBtn"), delGoalBtn = $("deleteGoalBtn"),
      resetBtn = $("resetEverythingBtn"), bg = document.querySelector(".background"),
      pomState = $("pomodoroState"), pomTimer = $("pomodoroTimer"),
      startPomBtn = $("startPomodoroBtn"), stopPomBtn = $("stopPomodoroBtn"),
      breakBtn = $("takeBreakBtn"), backBtn = $("backToWorkBtn");

/* ───────── Initial load for signed-out users ───────── */
function initFromLocal() {
  goals = JSON.parse(localStorage.getItem("goals")) || [];
  currentGoalId = localStorage.getItem("currentGoalId");

  if (!goals.length) createGoal("My First Goal");
  if (!currentGoalId) currentGoalId = goals[0].id;

  refreshUI();
}

/* ───────── Firestore load/save ───────── */
async function loadFromFirestore(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    goals = data.goals || [];
    currentGoalId = data.currentGoalId || (goals[0]?.id);
  } else {
    // first login → migrate any local data (if present) or create starter goal
    goals = JSON.parse(localStorage.getItem("goals")) || [];
    currentGoalId = localStorage.getItem("currentGoalId") || null;
    if (!goals.length) createGoal("My First Goal");
    if (!currentGoalId) currentGoalId = goals[0].id;
    await setDoc(ref, { goals, currentGoalId });
  }

  refreshUI();
}

function saveGoals() {
  if (auth.currentUser) {
    setDoc(doc(db, "users", auth.currentUser.uid),
           { goals, currentGoalId }, { merge: true });
  } else {
    localStorage.setItem("goals", JSON.stringify(goals));
    localStorage.setItem("currentGoalId", currentGoalId);
  }
}

/* ───────── Goal helpers ───────── */
function createGoal(name) {
  const g = { id: Date.now().toString(), name, totalTime: 0, logs: [] };
  goals.push(g);
  return g;
}

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
    opt.value = g.id; opt.textContent = g.name;
    goalSel.appendChild(opt);
  });
  goalSel.value = currentGoalId;
}

function updateGoalDisplay() {
  const g = currentGoal();
  if (!g) return;
  goalHeader.textContent = g.name;
  totalTime.textContent = `Total Time: ${fmt(g.totalTime)}`;
  progressBar.style.width = `${Math.min(g.totalTime / 72000 * 100, 100)}%`;
}

/* -------- session timer -------- */
function toggleSession() {
  isSessionActive = !isSessionActive;
  if (isSessionActive) {
    sessionStartTime = Date.now();
    sessionInterval  = setInterval(updateSessionTimer, 1000);
    startStopBtn.textContent = "Stop";
  } else stopSession();
  bg.classList.toggle("walking", isSessionActive && !isSessionPaused);
}

function updateSessionTimer() {
  const sec = Math.floor((Date.now() - sessionStartTime) / 1000);
  sessionTimer.textContent = fmt(sec);
  const g = currentGoal();
  totalTime.textContent = `Total Time: ${fmt(g.totalTime + sec)}`;
  progressBar.style.width =
    `${Math.min((g.totalTime + sec) / 72000 * 100, 100)}%`;
}

function stopSession() {
  clearInterval(sessionInterval);
  const secs = Math.floor((Date.now() - sessionStartTime) / 1000);
  const done = prompt("What did you accomplish?");
  if (secs > 0) {
    const g = currentGoal();
    g.totalTime += secs;
    g.logs.push({ timestamp: new Date().toLocaleString(),
                  duration: secs, accomplishment: done || "" });
    saveGoals(); renderLogs(); updateGoalDisplay();
  }
  sessionStartTime = 0;
  sessionTimer.textContent = "00:00:00";
  startStopBtn.textContent = "Start";
  bg.classList.remove("walking");
  isSessionActive = false;
}

/* -------- logs -------- */
function renderLogs() {
  logsBox.innerHTML = "";
  currentGoal().logs.forEach(l => {
    const p = document.createElement("p");
    p.textContent =
      `${l.timestamp} – Worked ${fmt(l.duration)} – ${l.accomplishment}`;
    logsBox.appendChild(p);
  });
}

/* -------- misc helpers -------- */
const pad = n => n.toString().padStart(2,"0");
const fmt = s => {
  const h = Math.floor(s / 3600),
        m = Math.floor((s % 3600) / 60),
        sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
};

/* ───────── Event bindings ───────── */
startStopBtn.addEventListener("click", toggleSession);
goalSel.addEventListener("change", e => {
  currentGoalId = e.target.value;
  saveGoals(); refreshUI();
});
newGoalBtn .addEventListener("click", () => {
  const name = prompt("New goal name:");
  if (name) { const g = createGoal(name); currentGoalId = g.id; saveGoals(); refreshUI(); }
});
editGoalBtn.addEventListener("click", () => {
  const g = currentGoal();
  const name = prompt("Rename goal:", g.name);
  if (name && name !== g.name) { g.name = name; saveGoals(); refreshUI(); }
});
delGoalBtn .addEventListener("click", () => {
  if (goals.length === 1) return alert("Cannot delete your only goal.");
  if (confirm("Delete this goal?")) {
    goals = goals.filter(g => g.id !== currentGoalId);
    currentGoalId = goals[0].id;
    saveGoals(); refreshUI();
  }
});
resetBtn  .addEventListener("click", () => {
  if (!confirm("Delete ALL goals and data?")) return;
  goals = []; currentGoalId = null;
  localStorage.clear();
  if (auth.currentUser)
    setDoc(doc(db,"users",auth.currentUser.uid),{});   // wipe remote doc
  location.reload();
});

/* ───────── Boot sequence ───────── */
if (!auth.currentUser) initFromLocal();
