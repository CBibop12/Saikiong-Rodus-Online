// Пример серверного кода для обработки diff-ов matchState
const io = require('socket.io')(server);
const mongoose = require('mongoose');

// Пример схемы для matchState в MongoDB
const matchStateSchema = new mongoose.Schema({
    roomCode: String,
    status: String,
    turn: Number,
    teams: {
        red: {
            characters: [{
                name: String,
                currentHP: Number,
                currentMana: Number,
                position: String,
                // ... другие поля
            }],
            baseHP: Number,
            gold: Number,
            remain: {
                moves: Number,
                actions: Number
            },
            inventory: [mongoose.Schema.Types.Mixed]
        },
        blue: {
            characters: [{
                name: String,
                currentHP: Number,
                currentMana: Number,
                position: String,
                // ... другие поля
            }],
            baseHP: Number,
            gold: Number,
            remain: {
                moves: Number,
                actions: Number
            },
            inventory: [mongoose.Schema.Types.Mixed]
        }
    },
    gameTime: {
        startTime: Number,
        stopTime: Number,
        pausedTime: Number,
        isPaused: Boolean
    },
    objectsOnMap: [mongoose.Schema.Types.Mixed],
    churches: [mongoose.Schema.Types.Mixed],
    // ... другие поля
}, {
    timestamps: true,
    minimize: false // Чтобы пустые объекты не удалялись
});

const MatchState = mongoose.model('MatchState', matchStateSchema);

// Функция для применения diff к объекту
const applyDiff = (obj, diff) => {
    const result = JSON.parse(JSON.stringify(obj)); // Глубокая копия

    Object.keys(diff).forEach(path => {
        const keys = path.split('.');
        let current = result;

        // Проходим по пути до предпоследнего ключа
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (current[key] === undefined) {
                current[key] = {};
            }
            current = current[key];
        }

        // Устанавливаем значение
        const lastKey = keys[keys.length - 1];
        current[lastKey] = diff[path];
    });

    return result;
};

// Функция для создания MongoDB update операции из diff
const createMongoUpdateFromDiff = (diff) => {
    const updateOps = { $set: {} };

    Object.keys(diff).forEach(path => {
        // Преобразуем точечную нотацию в MongoDB формат
        updateOps.$set[path] = diff[path];
    });

    return updateOps;
};

// Веб-сокет обработчик
io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    // Присоединение к комнате
    socket.on('JOIN_ROOM', (roomCode) => {
        socket.join(roomCode);
        console.log(`Пользователь ${socket.id} присоединился к комнате ${roomCode}`);
    });

    // Обработка обновлений matchState
    socket.on('MATCH_STATE_UPDATE', async (data) => {
        try {
            const { roomCode, diff, timestamp } = data;

            console.log(`Получен diff для комнаты ${roomCode}:`, diff);

            if (Object.keys(diff).length === 0) {
                console.log('Пустой diff, игнорируем');
                return;
            }

            // Создаем MongoDB update операцию
            const updateOps = createMongoUpdateFromDiff(diff);

            // Обновляем в базе данных
            const updatedMatch = await MatchState.findOneAndUpdate(
                { roomCode },
                updateOps,
                {
                    new: true,
                    upsert: true,
                    runValidators: true
                }
            );

            if (!updatedMatch) {
                console.error('Не удалось обновить matchState в БД');
                return;
            }

            console.log('MatchState успешно обновлен в БД');

            // Отправляем diff всем участникам комнаты (кроме отправителя)
            socket.to(roomCode).emit('MATCH_STATE_DIFF', {
                diff,
                timestamp,
                source: socket.id
            });

            // Опционально: отправляем подтверждение отправителю
            socket.emit('MATCH_STATE_UPDATE_CONFIRMED', {
                success: true,
                timestamp
            });

        } catch (error) {
            console.error('Ошибка при обновлении matchState:', error);

            // Отправляем ошибку отправителю
            socket.emit('MATCH_STATE_UPDATE_ERROR', {
                error: error.message,
                timestamp: data.timestamp
            });
        }
    });

    // Получение полного состояния для синхронизации
    socket.on('GET_MATCH_STATE', async (roomCode) => {
        try {
            const matchState = await MatchState.findOne({ roomCode });

            if (matchState) {
                socket.emit('MATCH_STATE_FULL', {
                    matchState: matchState.toObject(),
                    timestamp: Date.now()
                });
            } else {
                socket.emit('MATCH_STATE_NOT_FOUND', { roomCode });
            }
        } catch (error) {
            console.error('Ошибка при получении matchState:', error);
            socket.emit('MATCH_STATE_ERROR', { error: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Пользователь отключился:', socket.id);
    });
});

// Пример middleware для валидации diff
const validateDiff = (diff) => {
    const allowedPaths = [
        'teams.red.characters',
        'teams.blue.characters',
        'teams.red.baseHP',
        'teams.blue.baseHP',
        'teams.red.gold',
        'teams.blue.gold',
        'teams.red.remain',
        'teams.blue.remain',
        'teams.red.inventory',
        'teams.blue.inventory',
        'status',
        'turn',
        'gameTime',
        'objectsOnMap',
        'churches'
    ];

    const paths = Object.keys(diff);

    for (const path of paths) {
        const isAllowed = allowedPaths.some(allowedPath =>
            path.startsWith(allowedPath)
        );

        if (!isAllowed) {
            throw new Error(`Недопустимый путь в diff: ${path}`);
        }
    }

    return true;
};

// Экспорт для использования в других файлах
module.exports = {
    applyDiff,
    createMongoUpdateFromDiff,
    validateDiff,
    MatchState
}; 