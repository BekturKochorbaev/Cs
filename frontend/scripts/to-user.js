// ===== Получаем session из URL или localStorage =====
function getSessionId() {
    const urlParams = new URLSearchParams(window.location.search);
    let sessionId = urlParams.get('session');

    if (sessionId) {
        localStorage.setItem('sessionid', sessionId);
        // Убираем параметр из URL чтобы он не висел в адресной строке
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        sessionId = localStorage.getItem('sessionid');
    }

    return sessionId;
}

// ===== Запрос к бэкенду =====
function toAuthorization(callback) {
    const sessionId = getSessionId();

    if (!sessionId) {
        console.log('Session не найден');
        callback(null);
        return;
    }

    fetch('https://api.gldrop.fun/ru/user/', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Session ${sessionId}`
        }
    })
        .then(response => {
            if (!response.ok) {
                console.error('Ошибка авторизации:', response.status);
                return null;
            }
            return response.json();
        })
        .then(user => {
            callback(user, { Authorization: `Session ${sessionId}` });
        })
        .catch(error => {
            console.error('Ошибка запроса:', error);
            callback(null);
        });
}

// ===== ОСНОВНАЯ ФУНКЦИЯ =====
function toUser(callback) {
    toAuthorization((user, sessionHeader) => {
        callback(user, sessionHeader);
    });
}

// ===== Получение ID кейса =====
function getCaseId() {
    const urlParams = new URLSearchParams(window.location.search);
    return Number(urlParams.get('id'));
}

// ===== UI профиля + кликабельные кейсы =====
function toUserProfileUI(user) {
    const layer1 = document.querySelector('.layer1');
    const userProfile = document.getElementById('user-profile');

    if (!user) {
        if (layer1) layer1.style.display = 'block';
        if (userProfile) {
            userProfile.classList.add('hidden');
            userProfile.style.display = 'none';
        }
        return;
    }

    if (layer1) layer1.style.display = 'none';
    if (userProfile) {
        userProfile.classList.remove('hidden');
        userProfile.style.display = 'flex';
    }

    const userData = Array.isArray(user) ? user[0] : user;

    const avatarImg = document.getElementById('user-avatar');
    const nicknameEl = document.getElementById('user-nickname');
    const balanceEl = document.getElementById('user-balance');

    if (avatarImg) avatarImg.src = userData.avatar_url || '';
    if (nicknameEl) nicknameEl.textContent = userData.nickname || 'User';
    if (balanceEl) balanceEl.textContent = userData.balance ? `${userData.balance}₽` : '0.00₽';

    // Кликабельные кейсы (оставил как было)
    const caseElements = document.querySelectorAll('.cases');
    caseElements.forEach(caseElement => {
        const caseId = caseElement.getAttribute('data-case-id');
        if (!caseId || caseElement.querySelector('a')) return;

        const caseWrapper = caseElement.querySelector('.case-wrapper');
        if (!caseWrapper) return;

        const caseLink = document.createElement('a');
        caseLink.href = `case.html?id=${caseId}`;
        caseLink.style.textDecoration = 'none';

        while (caseWrapper.firstChild) {
            caseLink.appendChild(caseWrapper.firstChild);
        }

        caseElement.appendChild(caseLink);
    });
}