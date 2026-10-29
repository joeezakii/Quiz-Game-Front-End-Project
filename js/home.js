document.addEventListener('DOMContentLoaded', () => {
   const API_BASE_URL = 'https://joeezakyy.pythonanywhere.com/api';

    const avatars = [
         'https://api.dicebear.com/10.x/voxel-art/svg?seed=Sophie',
        'https://api.dicebear.com/10.x/voxel-art/svg?seed=Felix',
        'https://api.dicebear.com/10.x/voxel-art/svg?seed=Aneka',
        'https://api.dicebear.com/10.x/voxel-art/svg?seed=Milo',
        'https://api.dicebear.com/10.x/voxel-art/svg?seed=Luna',
        'https://api.dicebear.com/10.x/voxel-art/svg?seed=Sophie',
        'https://api.dicebear.com/10.x/voxel-bot/svg?seed=Aneka',
        'https://api.dicebear.com/10.x/voxel-bot/svg?seed=Milo',
        'https://api.dicebear.com/10.x/voxel-bot/svg?seed=Luna',
        'https://api.dicebear.com/10.x/voxel-bot/svg?seed=Sophie',
        'https://api.dicebear.com/10.x/voxel-bot/svg?seed=Felix',
    ];

    let currentAvatarIndex = 0;

    const usernameInput = document.getElementById('username-input');
    const welcomeUsername = document.getElementById('welcome-username');
    const avatarDisplay = document.getElementById('avatar-display');
    const btnPrev = document.getElementById('prev-avatar');
    const btnNext = document.getElementById('next-avatar');
    const btnStartGame = document.getElementById('start-game-btn');
    const btnLeaderboard = document.getElementById('view-leaderboard-btn');
    const leaderboardTbody = document.getElementById('leaderboard-tbody');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const savedUsername = localStorage.getItem('quizUsername') || '';
    const savedAvatar = localStorage.getItem('quizAvatar') || avatars[0];

    if (savedUsername) {
        usernameInput.value = savedUsername;
        welcomeUsername.textContent = savedUsername;
    }

    if (savedAvatar) {
        const index = avatars.indexOf(savedAvatar);
        if (index !== -1) currentAvatarIndex = index;
    }

    const updateAvatarUI = () => {
        avatarDisplay.src = avatars[currentAvatarIndex];
    };
    updateAvatarUI();

    usernameInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        welcomeUsername.textContent = val ? val : 'Guest';
    });

    btnPrev.addEventListener('click', () => {
        currentAvatarIndex = (currentAvatarIndex === 0) ? avatars.length - 1 : currentAvatarIndex - 1;
        updateAvatarUI();
    });

    btnNext.addEventListener('click', () => {
        currentAvatarIndex = (currentAvatarIndex === avatars.length - 1) ? 0 : currentAvatarIndex + 1;
        updateAvatarUI();
    });

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            themeIcon.className = 'bi bi-sun-fill fs-5 text-warning';
        } else {
            themeIcon.className = 'bi bi-moon-stars-fill fs-5 text-dark';
        }
    };

    setTheme(localStorage.getItem('theme') || 'light');

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    btnStartGame.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        if (!username) {
            alert('Please enter a username to play!');
            usernameInput.focus();
            return;
        }

        const selectedAvatar = avatars[currentAvatarIndex];
        localStorage.setItem('quizUsername', username);
        localStorage.setItem('quizAvatar', selectedAvatar);

        try {
            await fetch(`${API_BASE_URL}/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, avatar: selectedAvatar })
            });
        } catch (err) {
            console.warn('Backend unavailable, proceeding with local session.', err);
        }

        window.location.href = 'startgame.html';
    });

    btnLeaderboard.addEventListener('click', async () => {
        leaderboardTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Loading scores...</td></tr>';
        
        try {
            const response = await fetch(`${API_BASE_URL}/leaderboard/`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();

            if (data.length === 0) {
                leaderboardTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No scores logged yet!</td></tr>';
                return;
            }

            leaderboardTbody.innerHTML = data.map((entry, index) => `
                <tr>
                    <td class="fw-bold">${index + 1}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${entry.avatar}" alt="Avatar" class="rounded-circle" width="32" height="32">
                            <span class="fw-semibold">${entry.username}</span>
                        </div>
                    </td>
                    <td class="text-capitalize">${entry.category}</td>
                    <td class="text-capitalize"><span class="badge bg-secondary">${entry.difficulty}</span></td>
                    <td class="fw-bold text-primary">${entry.score}/${entry.total_questions}</td>
                    <td class="fw-bold text-success">${entry.percentage}%</td>
                </tr>
            `).join('');
        } catch (err) {
            leaderboardTbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Unable to load leaderboard. Server may be offline.</td></tr>';
        }
    });
});