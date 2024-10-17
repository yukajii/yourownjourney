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
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

// DOM elements
const goalHeader = document.getElementById('goalHeader');
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
const goalSelector = document.getElementById('goalSelector');
const newGoalBtn = document.getElementById('newGoalBtn');
const editGoalBtn = document.getElementById('editGoalBtn');
const deleteGoalBtn = document.getElementById('deleteGoalBtn');
const resetEverythingBtn = document.getElementById('resetEverythingBtn');
const background = document.querySelector('.background');

// Initialize from localStorage
function init() {
    goals = JSON.parse(localStorage.getItem('goals')) || [];
    currentGoalId = localStorage.getItem('currentGoalId');
    
    if (goals.length === 0) {
        createNewGoal('My First Goal');
    }
    
    if (!currentGoalId || !goals.find(goal => goal.id === currentGoalId)) {
        currentGoalId = goals[0].id;
    }
    
    updateGoalSelector();
    updateGoalDisplay();
    loadLogs();
    updatePomodoroDisplay(POMODORO_DURATION);
}

// Create a new goal
function createNewGoal(name) {
    const newGoal = {
        id: Date.now().toString(),
        name: name,
        totalTime: 0,
        logs: []
    };
    goals.push(newGoal);
    saveGoals();
    return newGoal;
}

// Save goals to localStorage
function saveGoals() {
    localStorage.setItem('goals', JSON.stringify(goals));
    localStorage.setItem('currentGoalId', currentGoalId);
}

// Update goal selector
function updateGoalSelector() {
    goalSelector.innerHTML = '';
    goals.forEach(goal => {
        const option = document.createElement('option');
        option.value = goal.id;
        option.textContent = goal.name;
        goalSelector.appendChild(option);
    });
    goalSelector.value = currentGoalId;
}

// Update goal display
function updateGoalDisplay() {
    const currentGoal = goals.find(goal => goal.id === currentGoalId);
    if (currentGoal) {
        goalHeader.textContent = currentGoal.name;
        updateTotalTimeDisplay(currentGoal.totalTime);
        updateProgressBar(currentGoal.totalTime);
    }
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
    const currentGoal = goals.find(goal => goal.id === currentGoalId);
    currentGoal.totalTime += sessionDuration;
    saveGoals();
    sessionStartTime = 0;
    updateSessionDisplay();
    updateGoalDisplay();
    startStopBtn.textContent = 'Start';
}

// Update session time
function updateSessionTime() {
    if (!isSessionPaused) {
        const currentSessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
        updateSessionDisplay(currentSessionTime);
        const currentGoal = goals.find(goal => goal.id === currentGoalId);
        updateProgressBar(currentGoal.totalTime + currentSessionTime);
        updateTotalTimeDisplay(currentGoal.totalTime + currentSessionTime);
    }
}

// Update session display
function updateSessionDisplay(time = 0) {
    sessionTimer.textContent = formatTime(time);
}

// Update total time display
function updateTotalTimeDisplay(time) {
    totalTimeDisplay.textContent = `Total Time: ${formatTime(time)}`;
}

// Update progress bar
function updateProgressBar(time) {
    const progress = (time / 72000) * 100; // Assuming 1 hour is 100%
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
    const currentGoal = goals.find(goal => goal.id === currentGoalId);
    const logEntry = {
        timestamp: new Date().toLocaleString(),
        duration: duration,
        accomplishment: accomplishment || 'No accomplishment recorded'
    };
    currentGoal.logs.push(logEntry);
    saveGoals();
    displayLogs();
}

// Display logs
function displayLogs() {
    const currentGoal = goals.find(goal => goal.id === currentGoalId);
    logsContainer.innerHTML = '';
    currentGoal.logs.forEach(log => {
        const logElement = document.createElement('p');
        logElement.textContent = `${log.timestamp} - Worked for ${formatTime(log.duration)} - ${log.accomplishment}`;
        logsContainer.appendChild(logElement);
    });
}

// Load logs
function loadLogs() {
    displayLogs();
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

// New Goal
function newGoal() {
    const name = prompt('Enter the name of your new goal:');
    if (name) {
        const newGoal = createNewGoal(name);
        currentGoalId = newGoal.id;
        updateGoalSelector();
        updateGoalDisplay();
        saveGoals();
    }
}

// Edit Goal
function editGoal() {
    const currentGoal = goals.find(goal => goal.id === currentGoalId);
    const newName = prompt('Enter the new name for your goal:', currentGoal.name);
    if (newName && newName !== currentGoal.name) {
        currentGoal.name = newName;
        updateGoalSelector();
        updateGoalDisplay();
        saveGoals();
    }
}

// Delete Goal
function deleteGoal() {
    if (goals.length === 1) {
        alert('You cannot delete your only goal.');
        return;
    }

    if (confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
        goals = goals.filter(goal => goal.id !== currentGoalId);
        currentGoalId = goals[0].id;
        updateGoalSelector();
        updateGoalDisplay();
        saveGoals();
    }
}

// Reset Everything
function resetEverything() {
    if (confirm('Are you sure you want to reset everything? This will delete all goals and data. This action cannot be undone.')) {
        localStorage.clear();
        location.reload();
    }
}

// Event Listeners
startStopBtn.addEventListener('click', toggleSession);
startPomodoroBtn.addEventListener('click', startPomodoro);
stopPomodoroBtn.addEventListener('click', stopPomodoro);
takeBreakBtn.addEventListener('click', takeBreak);
backToWorkBtn.addEventListener('click', backToWork);
newGoalBtn.addEventListener('click', newGoal);
editGoalBtn.addEventListener('click', editGoal);
deleteGoalBtn.addEventListener('click', deleteGoal);
resetEverythingBtn.addEventListener('click', resetEverything);
goalSelector.addEventListener('change', function() {
    currentGoalId = this.value;
    updateGoalDisplay();
    loadLogs();
    saveGoals();
});

// Initialize the app
init();