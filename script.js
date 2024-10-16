// Global variables
let goal = '';
let sessionStartTime = 0;
let totalTime = 0;
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
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

// DOM elements
const goalHeader = document.getElementById('goalHeader');
const goalInput = document.getElementById('goalInput');
const startStopBtn = document.getElementById('startStopBtn');
const sessionTimer = document.getElementById('sessionTimer');
const totalTimeDisplay = document.getElementById('totalTime');
const progressBar = document.getElementById('progressBar');
const pomodoroState = document.getElementById('pomodoroState');
const pomodoroTimer = document.getElementById('pomodoroTimer');
const startPomodoroBtn = document.getElementById('startPomodoroBtn');
const takeBreakBtn = document.getElementById('takeBreakBtn');
const backToWorkBtn = document.getElementById('backToWorkBtn');
const stopPomodoroBtn = document.getElementById('stopPomodoroBtn');
const logsContainer = document.getElementById('logs');
const renameGoalBtn = document.getElementById('renameGoalBtn');
const resetEverythingBtn = document.getElementById('resetEverythingBtn');
const background = document.querySelector('.background');

// Initialize from localStorage
function init() {
    goal = localStorage.getItem('goal') || '';
    totalTime = parseInt(localStorage.getItem('totalTime') || '0');
    updateGoalDisplay();
    updateTotalTimeDisplay();
    loadLogs();
    updatePomodoroDisplay(POMODORO_DURATION);
}

// Update goal display
function updateGoalDisplay() {
    goalHeader.textContent = goal || 'My Own Journey';
}

// Toggle session
function toggleSession() {
    isSessionActive = !isSessionActive;
    if (isSessionActive) {
        startSession();
    } else {
        stopSession();
    }
    background.classList.toggle('walking', isSessionActive && !isSessionPaused);
}

// Start session
function startSession() {
    sessionStartTime = Date.now() - (sessionStartTime ? Date.now() - sessionStartTime : 0);
    sessionInterval = setInterval(updateSessionTime, 1000);
    startStopBtn.textContent = 'Stop';
}

// Stop session
function stopSession() {
    clearInterval(sessionInterval);
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    const accomplishment = prompt("What did you accomplish in this session?");
    addLog(accomplishment, sessionDuration);
    totalTime += sessionDuration;
    localStorage.setItem('totalTime', totalTime.toString());
    sessionStartTime = 0;
    updateSessionDisplay();
    updateTotalTimeDisplay();
    updateProgressBar(totalTime);
    startStopBtn.textContent = 'Start';
}

// Update session time
function updateSessionTime() {
    if (!isSessionPaused) {
        const currentSessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
        updateSessionDisplay(currentSessionTime);
        updateProgressBar(totalTime + currentSessionTime);
        updateTotalTimeDisplay(totalTime + currentSessionTime);
    }
}

// Update session display
function updateSessionDisplay(time = 0) {
    sessionTimer.textContent = formatTime(time);
}

// Update total time display
function updateTotalTimeDisplay(time = totalTime) {
    totalTimeDisplay.textContent = `Total Time: ${formatTime(time)}`;
}

// Update progress bar
function updateProgressBar(time) {
    const progress = (time / 3600) * 100; // Assuming 1 hour is 100%
    progressBar.style.width = `${Math.min(progress, 100)}%`;
}

// Format time
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)}`;
}

// Pad zero
function padZero(num) {
    return num.toString().padStart(2, '0');
}

// Add log
function addLog(accomplishment, duration) {
    const logEntry = document.createElement('p');
    logEntry.textContent = `${new Date().toLocaleString()} - Worked for ${formatTime(duration)} - ${accomplishment || 'No accomplishment recorded'}`;
    logsContainer.appendChild(logEntry);
    saveLogs();
}

// Save logs
function saveLogs() {
    localStorage.setItem('logs', logsContainer.innerHTML);
}

// Load logs
function loadLogs() {
    logsContainer.innerHTML = localStorage.getItem('logs') || '';
}

// Start Pomodoro
function startPomodoro() {
    if (!isPomodoroActive) {
        isPomodoroActive = true;
        isBreakTime = false;
        pomodoroTimeLeft = POMODORO_DURATION;
        updatePomodoroTimer();
        pomodoroInterval = setInterval(updatePomodoroTimer, 1000);
        updatePomodoroButtons();
    }
}

// Stop Pomodoro
function stopPomodoro() {
    if (isPomodoroActive) {
        isPomodoroActive = false;
        isBreakTime = false;
        clearInterval(pomodoroInterval);
        updatePomodoroDisplay(POMODORO_DURATION);
        updatePomodoroButtons();
        
        // Resume session time tracking if it was paused
        if (isSessionActive && isSessionPaused) {
            toggleSessionPause();
        }
    }
}

// Take a Break
function takeBreak() {
    if (isPomodoroActive && !isBreakTime) {
        isBreakTime = true;
        breakTimeLeft = BREAK_DURATION;
        clearInterval(pomodoroInterval);
        pomodoroInterval = setInterval(updateBreakTimer, 1000);
        updatePomodoroButtons();
        
        if (isSessionActive && !isSessionPaused) {
            if (confirm("Do you want to pause the session time tracking during the break?")) {
                toggleSessionPause();
            }
        }
    }
}

// Back to Work
function backToWork() {
    if (isPomodoroActive && isBreakTime) {
        isBreakTime = false;
        clearInterval(pomodoroInterval);
        pomodoroInterval = setInterval(updatePomodoroTimer, 1000);
        updatePomodoroButtons();
        
        if (isSessionActive && isSessionPaused) {
            toggleSessionPause();
        }
    }
}

// Update Pomodoro Timer
function updatePomodoroTimer() {
    if (isPomodoroActive && !isBreakTime) {
        pomodoroTimeLeft = Math.max(0, pomodoroTimeLeft - 1);

        if (pomodoroTimeLeft === 0) {
            takeBreak();
        } else {
            updatePomodoroDisplay(pomodoroTimeLeft);
        }
    }
}

// Update Break Timer
function updateBreakTimer() {
    if (isPomodoroActive && isBreakTime) {
        breakTimeLeft = Math.max(0, breakTimeLeft - 1);

        if (breakTimeLeft === 0) {
            backToWork();
        } else {
            updatePomodoroDisplay(breakTimeLeft);
        }
    }
}

// Update Pomodoro Display
function updatePomodoroDisplay(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    pomodoroTimer.textContent = `${padZero(minutes)}:${padZero(seconds)}`;
}

// Update Pomodoro Buttons
function updatePomodoroButtons() {
    if (isPomodoroActive) {
        pomodoroState.textContent = isBreakTime ? 'On Break' : 'Working';
        startPomodoroBtn.style.display = 'none';
        stopPomodoroBtn.style.display = 'inline-block';
        takeBreakBtn.style.display = isBreakTime ? 'none' : 'inline-block';
        backToWorkBtn.style.display = isBreakTime ? 'inline-block' : 'none';
    } else {
        pomodoroState.textContent = 'Inactive';
        startPomodoroBtn.textContent = 'Start Pomodoro';
        startPomodoroBtn.style.display = 'inline-block';
        stopPomodoroBtn.style.display = 'none';
        takeBreakBtn.style.display = 'none';
        backToWorkBtn.style.display = 'none';
    }
}

// Toggle session pause
function toggleSessionPause() {
    isSessionPaused = !isSessionPaused;
    if (isSessionPaused) {
        pauseStartTime = Date.now();
    } else {
        const pauseDuration = Date.now() - pauseStartTime;
        sessionStartTime += pauseDuration;
    }
    background.classList.toggle('walking', isSessionActive && !isSessionPaused);
}

// Rename goal
function renameGoal() {
    const newGoal = prompt('Enter new goal:');
    if (newGoal !== null && newGoal.trim() !== '') {
        goal = newGoal.trim();
        localStorage.setItem('goal', goal);
        updateGoalDisplay();
    }
}

// Reset everything
function resetEverything() {
    if (confirm('Are you sure you want to reset everything? This action cannot be undone.')) {
        localStorage.clear();
        goal = '';
        totalTime = 0;
        sessionStartTime = 0;
        isSessionActive = false;
        isSessionPaused = false;
        clearInterval(sessionInterval);
        stopPomodoro();
        updateGoalDisplay();
        updateSessionDisplay();
        updateTotalTimeDisplay();
        updateProgressBar(0);
        logsContainer.innerHTML = '';
        startStopBtn.textContent = 'Start';
    }
}

// Event listeners
startStopBtn.addEventListener('click', toggleSession);
startPomodoroBtn.addEventListener('click', startPomodoro);
stopPomodoroBtn.addEventListener('click', stopPomodoro);
takeBreakBtn.addEventListener('click', takeBreak);
backToWorkBtn.addEventListener('click', backToWork);
renameGoalBtn.addEventListener('click', renameGoal);
resetEverythingBtn.addEventListener('click', resetEverything);

// Initialize the app
init();