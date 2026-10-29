const API_BASE_URL = 'https://joeezakyy.pythonanywhere.com/api';

let cat  = localStorage.getItem('category');
let diff = localStorage.getItem('difficulty');

let correctAnswers   = 0;
let numberOfQ        = 5;
let totalSeconds     = 10;
let data             = null;
let dataLoadingPromise = null;
let randomQuestion   = null;
let qeustionsId      = [];
let progressInterval = null;

// DOM Elements
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

// Step 2: Question Count Selection (Awaits async JSON data load)
numQ_btns.forEach(btn => {
    btn.addEventListener('click', async () => {
        numberOfQ = Number(btn.dataset.count) || 5;

        // Guarantee JSON data is fully loaded before rendering question card
        if (dataLoadingPromise) {
            await dataLoadingPromise;
        }

        if (!data || data.length === 0) {
            alert("No questions found for this category and difficulty.");
            window.location.href = './startgame.html';
            return;
        }

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

    // Question Text
    Question.textContent = randomQuestion.question || randomQuestion.title || "Question";

    // Options
    const questionOptions = randomQuestion.options || randomQuestion.answers || [];
    options.forEach((option, index) => {
        if (questionOptions[index] !== undefined) {
            option.textContent = questionOptions[index];
            option.style.display = 'flex';
        } else {
            option.style.display = 'none';
        }
    });

    // Image & Sidebar
    if (sidebar) {
        const imgSrc = randomQuestion.image || randomQuestion.img || '';
        if (!imgSrc) {
            sidebar.classList.add('d-none');
        } else {
            sidebar.classList.remove('d-none');
            if (sidebarImg) {
                // Sanitize relative image paths for GitHub Pages
                sidebarImg.src = (imgSrc.startsWith('http') || imgSrc.startsWith('/') || imgSrc.startsWith('./')) 
                    ? imgSrc 
                    : `./${imgSrc}`;
            }
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
    cat  = localStorage.getItem('category');
    diff = localStorage.getItem('difficulty');

    if (!cat || !diff) {
        alert('Please select a category and difficulty first!');
        window.location.href = './startgame.html';
        return [];
    }

    try {
        const response = await fetch(`./data/${cat}.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        let rawData = await response.json();

        // Support array [...] or object { questions: [...] } formats
        const Data = Array.isArray(rawData) ? rawData : (rawData.questions || rawData.data || []);

        // Ensure every question has a valid unique ID
        Data.forEach((item, index) => {
            if (item.id === undefined || item.id === null) {
                item.id = index + 1;
            }
        });

        // Case-insensitive filtering
        const filtered = Data.filter(item => {
            const itemDiff = item.difficulty ? String(item.difficulty).toLowerCase() : '';
            const itemCat  = item.category ? String(item.category).toLowerCase() : '';
            
            const diffMatch = !itemDiff || itemDiff === diff.toLowerCase() || itemDiff === 'init';
            const catMatch  = !itemCat || itemCat === cat.toLowerCase() || itemCat === 'init';

            return diffMatch && catMatch;
        });

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

// Back to setup button (Preserves username and avatar)
const backSetupBtn = document.querySelector('#backSetup');
if (backSetupBtn) {
    backSetupBtn.addEventListener('click', () => {
        localStorage.removeItem('category');
        localStorage.removeItem('difficulty');
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
                    category: cat || 'general',
                    difficulty: diff || 'medium',
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
document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);
    setTheme(localStorage.getItem('theme') || 'light');

    // Store fetch Promise to await when user picks question count
    dataLoadingPromise = retrieveData().then(res => {
        data = res;
        console.log('Loaded JSON Question Data:', data);
    });
});