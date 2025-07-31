# Система синхронизации через WebSocket Diff

## Обзор

Эта система позволяет синхронизировать состояние матча (`matchState`) между клиентами в реальном времени, отправляя только изменения (diff) вместо полного состояния.

## Как это работает

### 1. На клиенте (React)

#### Отправка изменений
```javascript
// При вызове updateMatchState автоматически:
// 1. Создается diff между старым и новым состоянием
// 2. Diff отправляется через веб-сокет
// 3. Локальное состояние обновляется

updateMatchState({
  "teams.red.baseHP": 450,
  "teams.red.characters.0.currentHP": 80
});
```

#### Получение изменений
```javascript
// Автоматически обрабатывается через useEffect
// Когда приходит diff от сервера, состояние обновляется локально
```

### 2. На сервере (Node.js + Socket.io + MongoDB)

#### Обработка diff
```javascript
socket.on('MATCH_STATE_UPDATE', async (data) => {
  const { roomCode, diff, timestamp } = data;
  
  // Валидация diff
  validateDiff(diff);
  
  // Обновление в MongoDB
  const updateOps = createMongoUpdateFromDiff(diff);
  await MatchState.findOneAndUpdate({ roomCode }, updateOps);
  
  // Отправка diff другим участникам
  socket.to(roomCode).emit('MATCH_STATE_DIFF', { diff, timestamp });
});
```

## Структура diff

Diff использует точечную нотацию для указания пути к изменённым свойствам:

```javascript
// Пример diff объекта
{
  "teams.red.baseHP": 450,
  "teams.red.characters.0.currentHP": 80,
  "teams.red.characters.0.position": "5-7",
  "teams.blue.gold": 1250,
  "turn": 15,
  "status": "in_progress"
}
```

## Преимущества

1. **Производительность**: Отправляются только изменения, не весь объект
2. **Сетевой трафик**: Значительно меньше данных передается
3. **Быстрая синхронизация**: Мгновенное обновление у всех участников
4. **Масштабируемость**: Система легко выдерживает большие объекты состояния

## События WebSocket

### Клиент → Сервер

| Событие | Описание | Данные |
|---------|----------|--------|
| `MATCH_STATE_UPDATE` | Отправка diff изменений | `{ roomCode, diff, timestamp }` |
| `GET_MATCH_STATE` | Запрос полного состояния | `roomCode` |
| `JOIN_ROOM` | Присоединение к комнате | `roomCode` |

### Сервер → Клиент

| Событие | Описание | Данные |
|---------|----------|--------|
| `MATCH_STATE_DIFF` | Получение diff от других игроков | `{ diff, timestamp, source }` |
| `MATCH_STATE_FULL` | Полное состояние матча | `{ matchState, timestamp }` |
| `MATCH_STATE_UPDATE_CONFIRMED` | Подтверждение обновления | `{ success, timestamp }` |
| `MATCH_STATE_UPDATE_ERROR` | Ошибка при обновлении | `{ error, timestamp }` |

## Примеры использования

### Простое обновление одного поля
```javascript
// Обновление HP персонажа
updateMatchState({
  "teams.red.characters.0.currentHP": 85
});
```

### Обновление нескольких полей
```javascript
// Завершение хода
updateMatchState({
  "teams.red.remain.actions": 0,
  "teams.red.remain.moves": 0,
  "turn": matchState.turn + 1
});
```

### Обновление массива
```javascript
// Обновление инвентаря
updateMatchState({
  "teams.red.inventory": [...newInventory]
});
```

## Безопасность

### Валидация diff

```javascript
const validateDiff = (diff) => {
  const allowedPaths = [
    'teams.red.characters',
    'teams.blue.characters',
    'teams.red.baseHP',
    'teams.blue.baseHP',
    'status',
    'turn'
    // ... другие разрешённые пути
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
```

## Обработка ошибок

### На клиенте
```javascript
// Обработка ошибок синхронизации
window.socket.on('MATCH_STATE_UPDATE_ERROR', (data) => {
  console.error('Ошибка синхронизации:', data.error);
  addActionLog(`Ошибка синхронизации: ${data.error}`, "error");
});
```

### На сервере
```javascript
// Обработка ошибок обновления
try {
  await MatchState.findOneAndUpdate({ roomCode }, updateOps);
} catch (error) {
  socket.emit('MATCH_STATE_UPDATE_ERROR', {
    error: error.message,
    timestamp: data.timestamp
  });
}
```

## Развертывание

### Установка зависимостей

```bash
npm install socket.io socket.io-client mongoose
```

### Настройка сервера

```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Импорт обработчиков
const { setupMatchStateHandlers } = require('./matchStateHandlers');

io.on('connection', (socket) => {
  setupMatchStateHandlers(socket, io);
});
```

### Настройка клиента

```javascript
import io from 'socket.io-client';

// Подключение к серверу
window.socket = io('http://localhost:3001');

// Компонент автоматически подключается к комнате
// и обрабатывает diff события
```

## Тестирование

### Проверка работы diff

```javascript
// Создаем тестовый diff
const oldState = { teams: { red: { baseHP: 500 } } };
const newState = { teams: { red: { baseHP: 450 } } };

const diff = createDeepDiff(oldState, newState);
console.log(diff); // { "teams.red.baseHP": 450 }

// Применяем diff
const result = applyDiffToState(oldState, diff);
console.log(result.teams.red.baseHP); // 450
```

## Лучшие практики

1. **Частота обновлений**: Не обновляйте состояние слишком часто
2. **Размер diff**: Группируйте связанные изменения в один diff
3. **Валидация**: Всегда валидируйте diff на сервере
4. **Обработка ошибок**: Предусмотрите fallback для получения полного состояния
5. **Логирование**: Логируйте все изменения для отладки

## Мониторинг

```javascript
// Добавление метрик
socket.on('MATCH_STATE_UPDATE', (data) => {
  const diffSize = JSON.stringify(data.diff).length;
  console.log(`Diff size: ${diffSize} bytes`);
  
  // Отправка метрик в систему мониторинга
  metrics.increment('matchstate.updates');
  metrics.histogram('matchstate.diff_size', diffSize);
});
``` 