/* -----------------------------------------------------------
 *  Firebase Auth helpers (import only what we need here)
 * ----------------------------------------------------------- */
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const auth     = window.firebaseAuth;
const provider = window.GoogleProvider;

/* -----------------------------------------------------------
 *  DOM references (incl. new Auth UI)
 * ----------------------------------------------------------- */
const loginBtn      = document.getElementById('loginBtn');
const logoutBtn     = document.getElementById('logoutBtn');
const userInfoSpan  = document.getElementById('userInfo');

/* ---- existing app DOM refs ---- */
const goalHeader          = document.getElementById('goalHeader');
const startStopBtn        = document.getElementById('startStopBtn');
const sessionTimer        = document.getElementById('sessionTimer');
const totalTimeDisplay    = document.getElementById('totalTime');
const progressBar         = document.getElementById('progressBar');
const pomodoroState       = document.getElementById('pomodoroState');
const pomodoroTimer       = document.getElementById('pomodoroTimer');
const startPomodoroBtn    = document.getElementById('startPomodoroBtn');
const takeBreakBtn        = document.getElementById('takeBreakBtn');
const backToWorkBtn       = document.getElementById('backToWorkBtn');
const stopPomodoroBtn     = document.getElementById('stopPomodoroBtn');
const logsContainer       = document.getElementById('logs');
const goalSelector        = document.getElementById('goalSelector');
const newGoalBtn          = document.getElementById('newGoalBtn');
const editGoalBtn         = document.getElementById('editGoalBtn');
const deleteGoalBtn       = document.getElementById('deleteGoalBtn');
const resetEverythingBtn  = document.getElementById('resetEverythingBtn');
const background          = document.querySelector('.background');

/* -----------------------------------------------------------
 *  Auth logic
 * ----------------------------------------------------------- */
function updateAuthUI(user) {
    const loggedIn = !!user;
    loginBtn.hidden   = loggedIn;
    logoutBtn.hidden  = !loggedIn;
    userInfoSpan.hidden = !loggedIn;

    if (loggedIn) {
        userInfoSpan.textContent = `👋 ${user.displayName}`;
        // later: load user-specific data from Firestore here
    } else {
        userInfoSpan.textContent = '';
        // later: maybe show a demo state or clear sensitive data
    }
}

loginBtn.addEventListener('click', () =>
    signInWithPopup(auth, provider).catch(console.error)
);

logoutBtn.addEventListener('click', () =>
    signOut(auth).catch(console.error)
);

onAuthStateChanged(auth, updateAuthUI);

/* -----------------------------------------------------------
 *  Productivity-app state & logic (unchanged except tiny tweaks)
 * ----------------------------------------------------------- */
// Global variables
let goals = [];
let currentGoalId = null;
let sessionStartTime = 0;
let isSessionActive = false;
let sessionInterval;
let isSessionPaused = false;
let pauseStartTime = 0;

// Pomodoro-related variables
let pomodoroInterval;
let pomodoroEndTime;
let isPomodoroActive = false;
let isBreakTime = false;
let pomodoroTimeLeft = 0;
let breakTimeLeft = 0;

const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION    = 5 * 60;  // 5 minutes in seconds

/* --------------------  localStorage helpers -------------------- */
function init() {
    goals = JSON.parse(localStorage.getItem('goals')) || [];
    currentGoalId = localStorage.getItem('currentGoalId');

    if (goals.length === 0) {
        createNewGoal('My First Goal');
    }

    if (!currentGoalId || !goals.find(g => g.id === currentGoalId)) {
        currentGoalId = goals[0].id;
    }

    updateGoalSelector();
    updateGoalDisplay();
    loadLogs();
    updatePomodoroDisplay(POMODORO_DURATION);
}

/* --------------------  Goal CRUD & UI -------------------- */
function createNewGoal(name) {
    const g = {
        id: Date.now().toString(),
        name,
        totalTime : 0,
        logs      : []
    };
    goals.push(g);
    saveGoals();
    return g;
}

function saveGoals() {
    localStorage.setItem('goals', JSON.stringify(goals));
    localStorage.setItem('currentGoalId', currentGoalId);
}

function updateGoalSelector() {
    goalSelector.innerHTML = '';
    goals.forEach(goal => {
        const opt = document.createElement('option');
        opt.value = goal.id;
        opt.textContent = goal.name;
        goalSelector.appendChild(opt);
    });
    goalSelector.value = currentGoalId;
}

function updateGoalDisplay() {
    const g = goals.find(goal => goal.id === currentGoalId);
    if (!g) return;
    goalHeader.textContent = g.name;
    updateTotalTimeDisplay(g.totalTime);
    updateProgressBar(g.totalTime);
}

/* --------------------  Session timers -------------------- */
function toggleSession() {
    isSessionActive = !isSessionActive;
    if (isSessionActive)  startSession();
    else                   stopSession();

    background.classList.toggle('walking', isSessionActive && !isSessionPaused);
}

function startSession() {
    sessionStartTime = Date.now() - (sessionStartTime ? Date.now() - sessionStartTime : 0);
    sessionInterval  = setInterval(updateSessionTime, 1_000);
    startStopBtn.textContent = 'Stop';
}

function stopSession() {
    clearInterval(sessionInterval);
    const sessionSeconds = Math.floor((Date.now() - sessionStartTime) / 1_000);
    const accomplishment = prompt("What did you accomplish in this session?");
    addLog(accomplishment, sessionSeconds);

    const g = goals.find(goal => goal.id === currentGoalId);
    g.totalTime += sessionSeconds;
    saveGoals();

    sessionStartTime = 0;
    updateSessionDisplay();
    updateGoalDisplay();
    startStopBtn.textContent = 'Start';
}

function updateSessionTime() {
    if (!isSessionPaused) {
        const seconds = Math.floor((Date.now() - sessionStartTime) / 1_000);
        updateSessionDisplay(seconds);

        const g = goals.find(goal => goal.id === currentGoalId);
        updateProgressBar(g.totalTime + seconds);
        updateTotalTimeDisplay(g.totalTime + seconds);
    }
}

function updateSessionDisplay(sec = 0) {
    sessionTimer.textContent = formatTime(sec);
}

function updateTotalTimeDisplay(sec) {
    totalTimeDisplay.textContent = `Total Time: ${formatTime(sec)}`;
}

function updateProgressBar(sec) {
    const percent = (sec / 72_000) * 100;   // 20 h = 100 %
    progressBar.style.width = `${Math.min(percent, 100)}%`;
}

/* --------------------  Time + log helpers -------------------- */
function formatTime(sec) {
    const h = Math.floor(sec / 3_600);
    const m = Math.floor((sec % 3_600) / 60);
    const s = sec % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
const pad = n => n.toString().padStart(2,'0');

function addLog(accomplishment, duration) {
    const g = goals.find(goal => goal.id === currentGoalId);
    g.logs.push({
        timestamp    : new Date().toLocaleString(),
        duration,
        accomplishment : accomplishment || 'No accomplishment recorded'
    });
    saveGoals();
    displayLogs();
}

function displayLogs() {
    const g = goals.find(goal => goal.id === currentGoalId);
    logsContainer.innerHTML = '';
    g.logs.forEach(l => {
        const p = document.createElement('p');
        p.textContent =
            `${l.timestamp} – Worked ${formatTime(l.duration)} – ${l.accomplishment}`;
        logsContainer.appendChild(p);
    });
}
function loadLogs() { displayLogs(); }

/* --------------------  Pomodoro -------------------- */
function startPomodoro() {
    if (isPomodoroActive) return;
    isPomodoroActive = true;
    isBreakTime      = false;
    pomodoroTimeLeft = POMODORO_DURATION;
    updatePomodoroDisplay(pomodoroTimeLeft);
    pomodoroInterval = setInterval(updatePomodoroTimer, 1_000);
    updatePomodoroButtons();
}

function stopPomodoro() {
    if (!isPomodoroActive) return;
    isPomodoroActive = false;
    clearInterval(pomodoroInterval);
    updatePomodoroDisplay(POMODORO_DURATION);
    updatePomodoroButtons();

    // resume any paused session
    if (isSessionActive && isSessionPaused) toggleSessionPause();
}

function takeBreak() {
    if (!isPomodoroActive || isBreakTime) return;
    isBreakTime   = true;
    breakTimeLeft = BREAK_DURATION;
    clearInterval(pomodoroInterval);
    pomodoroInterval = setInterval(updateBreakTimer, 1_000);
    updatePomodoroButtons();

    if (isSessionActive && !isSessionPaused) {
        if (confirm("Pause the session timer during the break?"))
            toggleSessionPause();
    }
}

function backToWork() {
    if (!isPomodoroActive || !isBreakTime) return;
    isBreakTime = false;
    clearInterval(pomodoroInterval);
    pomodoroInterval = setInterval(updatePomodoroTimer, 1_000);
    updatePomodoroButtons();

    if (isSessionActive && isSessionPaused) toggleSessionPause();
}

function updatePomodoroTimer() {
    if (!isPomodoroActive || isBreakTime) return;
    pomodoroTimeLeft = Math.max(0, pomodoroTimeLeft - 1);
    if (pomodoroTimeLeft === 0) takeBreak();
    else updatePomodoroDisplay(pomodoroTimeLeft);
}

function updateBreakTimer() {
    if (!isPomodoroActive || !isBreakTime) return;
    breakTimeLeft = Math.max(0, breakTimeLeft - 1);
    if (breakTimeLeft === 0) backToWork();
    else updatePomodoroDisplay(breakTimeLeft);
}

function updatePomodoroDisplay(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    pomodoroTimer.textContent = `${pad(m)}:${pad(s)}`;
}

function updatePomodoroButtons() {
    if (isPomodoroActive) {
        pomodoroState.textContent = isBreakTime ? 'On Break' : 'Working';
        startPomodoroBtn.style.display = 'none';
        stopPomodoroBtn.style.display  = 'inline-block';
        takeBreakBtn.style.display     = isBreakTime ? 'none' : 'inline-block';
        backToWorkBtn.style.display    = isBreakTime ? 'inline-block' : 'none';
    } else {
        pomodoroState.textContent = 'Inactive';
        startPomodoroBtn.style.display = 'inline-block';
        stopPomodoroBtn.style.display  = 'none';
        takeBreakBtn.style.display     = 'none';
        backToWorkBtn.style.display    = 'none';
    }
}

/* --------------------  Misc controls -------------------- */
function toggleSessionPause() {
    isSessionPaused = !isSessionPaused;
    if (isSessionPaused) pauseStartTime = Date.now();
    else sessionStartTime += Date.now() - pauseStartTime;

    background.classList.toggle('walking', isSessionActive && !isSessionPaused);
}

/* Goal CRUD buttons */
function newGoal() {
    const name = prompt('Enter the name of your new goal:');
    if (!name) return;
    const g = createNewGoal(name);
    currentGoalId = g.id;
    updateGoalSelector();
    updateGoalDisplay();
    saveGoals();
}

function editGoal() {
    const g = goals.find(goal => goal.id === currentGoalId);
    const newName = prompt('Enter a new name:', g.name);
    if (newName && newName !== g.name) {
        g.name = newName;
        updateGoalSelector();
        updateGoalDisplay();
        saveGoals();
    }
}

function deleteGoal() {
    if (goals.length === 1) {
        alert('You cannot delete your only goal.');
        return;
    }
    if (confirm('Delete this goal? This cannot be undone.')) {
        goals = goals.filter(g => g.id !== currentGoalId);
        currentGoalId = goals[0].id;
        updateGoalSelector();
        updateGoalDisplay();
        saveGoals();
    }
}

function resetEverything() {
    if (confirm('Delete ALL goals and data? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
    }
}

/* --------------------  Event listeners -------------------- */
startStopBtn        .addEventListener('click', toggleSession);
startPomodoroBtn    .addEventListener('click', startPomodoro);
stopPomodoroBtn     .addEventListener('click', stopPomodoro);
takeBreakBtn        .addEventListener('click', takeBreak);
backToWorkBtn       .addEventListener('click', backToWork);
newGoalBtn          .addEventListener('click', newGoal);
editGoalBtn         .addEventListener('click', editGoal);
deleteGoalBtn       .addEventListener('click', deleteGoal);
resetEverythingBtn  .addEventListener('click', resetEverything);

goalSelector.addEventListener('change', e => {
    currentGoalId = e.target.value;
    updateGoalDisplay();
    loadLogs();
    saveGoals();
});

/* --------------------  Boot the app -------------------- */
init();
