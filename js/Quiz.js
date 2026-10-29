const API_BASE_URL = 'https://joeezakyy.pythonanywhere.com/api';

// Retrieve category and difficulty from localStorage
const cat  = localStorage.getItem('category');
const diff = localStorage.getItem('difficulty');

let correctAnswers   = 0;
let numberOfQ        = 5;
let totalSeconds     = 10;
let data             = null;
let randomQuestion   = null;
let qeustionsId      = [];
let progressInterval = null;

// DOM Elements - Declared at top to prevent Temporal Dead Zone (TDZ) Reference Errors
const durationContainer      = document.querySelector('.Duration-Container');
const questionCountContainer = document.querySelector('.QuestionCount-Container');
const quizContainer          = document.querySelector('.Quiz-Container');
const dashBoardContainer     = document.querySelector('.Dashboard-Container');

const duration_btns = document.querySelectorAll('.Duration-Container button');
const numQ_btns     = document.querySelectorAll('.QuestionCount-Container button');

const Question      = document.querySelector('.Question');
const options       = document.querySelectorAll('.option');
const sidebar       = document.querySelector('.image-sidebar');
const sidebarImg    = document.querySelector('.Img img');
const toggleBtn     = document.getElementById('sidebarToggle');

const progressBar       = document.querySelector('.progress-bar');
const progressContainer = document.querySelector('.progress');

// Disable / Enable Option Buttons
function setButtonsDisabled(isDisabled) {
    options.forEach(btn => {
        btn.disabled = isDisabled;
    });
}

function resetButtonStatus() {
    options.forEach(btn => {
        btn.classList.remove('btn-danger', 'btn-success', 'disabled');
        btn.disabled = false;
    });
}

// Step 1: Duration Selection
duration_btns.forEach(btn => {
    btn.addEventListener('click', () => {
        totalSeconds = Number(btn.dataset.duration) || 10;
        durationContainer.classList.add('d-none');
        questionCountContainer.classList.remove('d-none');
    });
});

// Step 2: Question Count Selection
numQ_btns.forEach(btn => {
    btn.addEventListener('click', () => {
        numberOfQ = Number(btn.dataset.count) || 5;
        questionCountContainer.classList.add('d-none');
        quizContainer.classList.remove('d-none');
        nextQuestion();
    });
});

// Step 3: Option Click Listener
options.forEach(option => {
    option.addEventListener('click', () => {
        updateProgressBar(0, true);

        const optionValue = option.dataset.value;
        const correctAnswerIndex = randomQuestion.correctAnswer;

        setButtonsDisabled(true);

        if (optionValue == correctAnswerIndex) {
            option.classList.add('btn-success');
            correctAnswers++;
        } else {
            option.classList.add('btn-danger');
            if (options[correctAnswerIndex - 1]) {
                options[correctAnswerIndex - 1].classList.add('btn-success');
            }
        }

        setTimeout(nextQuestion, 2000);
    });
});

function getRandomQuestion() {
    if (!data || data.length === 0) return null;

    const availableQuestions = data.filter(item => !qeustionsId.includes(item.id));

    if (availableQuestions.length === 0 || qeustionsId.length >= numberOfQ) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    qeustionsId.push(selectedQuestion.id);
    return selectedQuestion;
}

function setCardElements() {
    randomQuestion = getRandomQuestion();

    if (randomQuestion === null) {
        renderDashBoard();
        return null;
    }

    Question.textContent = randomQuestion.question;
    options.forEach((option, index) => {
        if (randomQuestion.options && randomQuestion.options[index] !== undefined) {
            option.textContent = randomQuestion.options[index];
        }
    });

    if (sidebar) {
        if (!randomQuestion.image || randomQuestion.image === '') {
            sidebar.classList.add('d-none');
        } else {
            sidebar.classList.remove('d-none');
            if (sidebarImg) sidebarImg.src = randomQuestion.image;
        }
    }

    return true;
}

function nextQuestion() {
    if (setCardElements() === null) return;

    startLoopingProgress();
    setButtonsDisabled(false);
    resetButtonStatus();
}

async function retrieveData() {
    if (!cat || !diff) {
        alert('Please select a category and difficulty first!');
        window.location.href = './startgame.html';
        return [];
    }

    try {
        const response = await fetch(`./data/${cat}.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const Data = await response.json();

        // Case-insensitive filtering
        const filtered = Data.filter(item => {
            const itemDiff = item.difficulty ? item.difficulty.toLowerCase() : '';
            const itemCat  = item.category ? item.category.toLowerCase() : '';
            
            const diffMatch = !itemDiff || itemDiff === diff.toLowerCase() || itemDiff === 'init';
            const catMatch  = !itemCat || itemCat === cat.toLowerCase() || itemCat === 'init';

            return diffMatch && catMatch;
        });

        // Fallback: Use full file data if filtered result is empty
        return filtered.length > 0 ? filtered : Data;
    } catch (error) {
        console.error('Error fetching question data:', error);
        alert('Failed to load question dataset. Returning to setup.');
        window.location.href = './startgame.html';
        return [];
    }
}

// Theme handling
function setTheme(theme) {
    const themeIcon = document.getElementById('theme-icon');
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);

    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'bi bi-sun-fill fs-5 text-warning';
        } else {
            themeIcon.className = 'bi bi-moon-stars-fill fs-5 text-dark';
        }
    }
}

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
}

// Timer Handling
const updateProgressBar = (seconds, stop = false) => {
    if (stop) {
        clearInterval(progressInterval);
        return;
    }

    if (progressBar) {
        progressBar.style.width = `${(seconds / totalSeconds) * 100}%`;
        progressBar.textContent = `${seconds} s`;
    }
    if (progressContainer) {
        progressContainer.setAttribute('aria-valuenow', seconds);
    }

    if (seconds >= totalSeconds) {
        clearInterval(progressInterval);
        if (progressBar) {
            progressBar.style.setProperty('background-color', '#dc3545', 'important');
            progressBar.classList.add('progress-bar-animated');
        }
        setButtonsDisabled(true);

        if (randomQuestion && options[randomQuestion.correctAnswer - 1]) {
            options[randomQuestion.correctAnswer - 1].classList.add('btn-success');
        }
        setTimeout(nextQuestion, 2000);
    }
};

function startLoopingProgress() {
    if (progressBar) progressBar.style.removeProperty('background-color');
    if (progressInterval) clearInterval(progressInterval);

    let progressValue = 0;
    if (progressBar) {
        progressBar.style.width = `0%`;
        progressBar.textContent = `0 s`;
    }

    progressInterval = setInterval(() => {
        updateProgressBar(++progressValue);
    }, 1000);
}

// Sidebar toggle handler
if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}

// Back to setup button
const backSetupBtn = document.querySelector('#backSetup');
if (backSetupBtn) {
    backSetupBtn.addEventListener('click', () => {
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        localStorage.setItem('theme', theme);
        window.location.href = './index.html';
    });
}

// Dashboard results & Leaderboard API posting
async function renderDashBoard() {
    updateProgressBar(0, true);

    quizContainer.classList.add('d-none');
    dashBoardContainer.classList.remove('d-none');

    document.getElementById('stat-total-questions').textContent = numberOfQ;
    document.getElementById('stat-time-per-question').textContent = `${totalSeconds}s`;
    document.getElementById('stat-correct-answers').textContent = correctAnswers;

    const percentage = Math.round((correctAnswers / numberOfQ) * 100);
    document.getElementById('stat-percentage').textContent = `${percentage}%`;

    const username = localStorage.getItem('quizUsername');
    if (username) {
        try {
            await fetch(`${API_BASE_URL}/leaderboard/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    category: cat,
                    difficulty: diff,
                    score: correctAnswers,
                    total_questions: numberOfQ,
                    percentage: percentage
                })
            });
        } catch (err) {
            console.warn('Failed to post score to leaderboard API:', err);
        }
    }
}

// Restart quiz button
const restartBtn = document.querySelector('#restart-quiz');
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        window.location.reload();
    });
}

// Page Load Initialization
document.addEventListener('DOMContentLoaded', async () => {
    window.scrollTo(0, 0);
    setTheme(localStorage.getItem('theme') || 'light');

    data = await retrieveData();
    console.log('Loaded JSON Question Data:', data);
});