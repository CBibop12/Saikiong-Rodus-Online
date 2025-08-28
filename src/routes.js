// Для локальной разработки используем относительный путь.
// Это позволяет Vite-proxy перенаправлять запросы на бэкенд и избавляет от CORS-ошибок.
const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://sr-game-backend-32667b36f309.herokuapp.com';
export const CHAT_BASE = import.meta.env.VITE_CHAT_BASE || 'https://saikiongrodus-backend-e47b3de7cf19.herokuapp.com';
// Конфигурация запросов
const defaultHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
});

// Хелпер для получения токена
const getToken = () => localStorage.getItem('srUserToken');

// Хелпер для проверки и парсинга ответа
const handleResponse = async (response) => {
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

// Роуты для пользователей
export const userRoutes = {
    // Получить свой профиль
    getProfile: async () => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/users/me`, {
            headers: defaultHeaders(token),
        });
        return handleResponse(response);
    },

    getUserById: async (id) => {
        const response = await fetch(`${API_BASE}/users/id/${id}`, {
            headers: defaultHeaders(getToken()),
        });
        return handleResponse(response);
    },

    // Получить пользователя по никнейму
    getUserByUsername: async (username) => {
        const response = await fetch(`${API_BASE}/users/username/${username}`, {
            headers: defaultHeaders(getToken()),
        });
        return handleResponse(response);
    },

    // Расширенный поиск пользователей
    searchUsers: async (query, filter) => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const url = new URL(`${API_BASE}/api/users/search`, window.location.origin);
        url.searchParams.append('q', query);
        if (filter) url.searchParams.append('filter', filter);

        const response = await fetch(url.toString(), {
            headers: defaultHeaders(token),
        });
        return handleResponse(response);
    },

    // Получить списки связей пользователя
    getFollowers: async () => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/api/users/followers`, {
            headers: defaultHeaders(token),
        });
        return handleResponse(response);
    },

    getFollowing: async () => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/api/users/following`, {
            headers: defaultHeaders(token),
        });
        return handleResponse(response);
    },

    getFriends: async () => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/api/users/friends`, {
            headers: defaultHeaders(token),
        });
        return handleResponse(response);
    },
};

// Роуты для комнат
export const roomRoutes = {
    // Создать новую комнату
    create: async (username) => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/rooms`, {
            method: 'POST',
            headers: defaultHeaders(token),
            body: JSON.stringify({
                user: username,
            }),
        });
        return handleResponse(response);
    },

    // Получить комнату по коду
    getByCode: async (code) => {
        const response = await fetch(`${API_BASE}/rooms/${code}`);
        return handleResponse(response);
    },

    // Пригласить игрока по никнейму
    invitePlayer: async (code, username) => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/rooms/${code}/invite`, {
            method: 'POST',
            headers: defaultHeaders(token),
            body: JSON.stringify({ username }),
        });
        return handleResponse(response);
    },

    // Удалить участника (только админ)
    removeParticipant: async (code, username) => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/rooms/${code}/participants/${username}`, {
            method: 'DELETE',
            headers: defaultHeaders(token),
        });
        return handleResponse(response);
    },

    // Обновить состояние комнаты (только админ)
    updateState: async (code, roomState) => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/rooms/${code}/state`, {
            method: 'PATCH',
            headers: defaultHeaders(token),
            body: JSON.stringify({ roomState }),
        });
        return handleResponse(response);
    },

    // Выйти из комнаты (участник или админ)
    leave: async (code) => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/rooms/${code}/leave`, {
            method: 'POST',
            headers: defaultHeaders(token),
        });
        // Сервер возвращает 204 No Content при успешном выходе
        if (response.status === 204) return;
        return handleResponse(response);
    },
};

// Роуты для игры
export const gameRoutes = {
    // Начать новую игру
    start: async (teams, selectedMap) => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/game/start`, {
            method: 'POST',
            headers: defaultHeaders(token),
            body: JSON.stringify({ teams, selectedMap }),
        });
        return handleResponse(response);
    },

    // Получить состояние игры
    getState: async (gameId) => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/game/${gameId}/state`, {
            headers: defaultHeaders(token),
        });
        return handleResponse(response);
    },

    // Отправить команду
    sendCommand: async (gameId, command) => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/game/${gameId}/command`, {
            method: 'POST',
            headers: defaultHeaders(token),
            body: JSON.stringify({ command }),
        });
        return handleResponse(response);
    },

    // Завершить ход
    endTurn: async (gameId) => {
        const token = getToken();
        if (!token) throw new Error('Токен не найден');

        const response = await fetch(`${API_BASE}/game/${gameId}/endTurn`, {
            method: 'POST',
            headers: defaultHeaders(token),
        });
        return handleResponse(response);
    },
};

// Создание или получение чата с пользователем
export async function getChat(friendId) {
    const response = await fetch(`${CHAT_BASE}/api/chats/${friendId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...defaultHeaders(getToken()),
        },
    });

    if (!response.ok) {
        let errorMsg = 'Ошибка создания чата';
        try {
            const errJson = await response.json();
            errorMsg = errJson?.message || errorMsg;
        } catch { /* ignore JSON parse error */ void 0; }
        throw new Error(errorMsg);
    }

    return response.json();
}

// Получение сообщений из чата
export async function getChatMessages(chatId) {
    const response = await fetch(`${CHAT_BASE}/api/chats/${chatId}`, {
        method: 'GET', // явно указываем метод
        headers: {
            ...defaultHeaders(getToken()),
        },
        // убираем body - он не нужен для GET запроса
    });

    if (!response.ok) {
        let errorMsg = 'Ошибка получения сообщений';
        try {
            const errJson = await response.json();
            errorMsg = errJson?.message || errorMsg;
        } catch { /* ignore JSON parse error */ void 0; }
        throw new Error(errorMsg);
    }

    return response.json();
}

// Отправка сообщения в чат
export async function sendMessage(chatId, text) {
    const response = await fetch(`${CHAT_BASE}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...defaultHeaders(getToken()),
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        let errorMsg = 'Ошибка отправки сообщения';
        try {
            const errJson = await response.json();
            errorMsg = errJson?.message || errorMsg;
        } catch { /* ignore JSON parse error */ void 0; }
        throw new Error(errorMsg);
    }

    return response.json();
}


// Внутриигровые запросы

// Character Store API
export async function findCharacter(name, roomCode) {
    const token = getToken();
    if (!token) throw new Error('Токен не найден');

    const response = await fetch(`${API_BASE}/api/tools/character/find/${roomCode}/${name}`, {
        method: 'GET',
        headers: {
            ...defaultHeaders(token),
        },
    });
    return response.json();
}

export async function findCharacterByPosition(position, roomCode) {
    const token = getToken();
    if (!token) throw new Error('Токен не найден');

    const response = await fetch(`${API_BASE}/api/tools/character/find-by-position/${roomCode}/${position}`, {
        method: 'GET',
        headers: {
            ...defaultHeaders(token),
        },
    });
    return response.json();
}



// Map Store API
export async function cellHasType(types, coord, roomCode) {
    const token = getToken();
    if (!token) throw new Error('Токен не найден');

    // Поддерживаем как массив типов, так и строку с запятыми
    const typesArray = Array.isArray(types)
        ? types
        : String(types)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

    // Разрешаем передавать координату как массив [x, y] или готовую строку "x-y"
    const coordStr = Array.isArray(coord) ? `${coord[0] + 1}-${coord[1] + 1}` : coord;

    const response = await fetch(`${API_BASE}/api/tools/map/cell-has-type/${roomCode}`, {
        method: 'POST',
        headers: {
            ...defaultHeaders(token),
        },
        body: JSON.stringify({ types: typesArray, coord: coordStr }),
    });
    return response.json();
}

export async function objectOnCell(coord, roomCode, type = '') {
    const token = getToken();
    console.log('token', token);
    if (!token) throw new Error('Токен не найден');

    const coordStr = Array.isArray(coord) ? `${coord[0] + 1}-${coord[1] + 1}` : coord;
    const response = await fetch(`${API_BASE}/api/tools/map/object-on-cell/${roomCode}/${coordStr}?type=${type}`, {
        method: 'GET',
        headers: {
            ...defaultHeaders(token),
        },
    });
    return response.json();
}

// Получение свободных линий клеток от стартовой координаты
export async function getFreeCellLines(roomCode, coords, range) {
    const token = getToken();
    if (!token) throw new Error('Токен не найден');

    const response = await fetch(`${API_BASE}/api/tools/map/get-free-cell-lines/${roomCode}`, {
        method: 'POST',
        headers: {
            ...defaultHeaders(token),
        },
        body: JSON.stringify({ range, coords }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`getFreeCellLines failed: ${response.status} ${errorText}`);
    }
    return response.json();
}

export async function getFreeCellsAround(roomCode, coords) {
    const token = getToken();
    if (!token) throw new Error('Токен не найден');

    const response = await fetch(`${API_BASE}/api/tools/map/get-free-cells-around/${roomCode}/${coords}`, {
        method: 'GET',
        headers: {
            ...defaultHeaders(token),
        },
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`getFreeCellsAround failed: ${response.status} ${errorText}`);
    }
    return response.json();
}

// End Turn API
export async function endTurn(roomCode, matchState) {
    const token = getToken();
    if (!token) throw new Error('Токен не найден');

    const response = await fetch(`${API_BASE}/rooms/${roomCode}/endTurn`, {
        method: 'POST',
        headers: {
            ...defaultHeaders(token),
        },
        body: JSON.stringify({ matchState }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`EndTurn failed: ${response.status} ${errorText}`);
    }

    return response.json();
}