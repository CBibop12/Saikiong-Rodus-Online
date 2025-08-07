export const randomNumber = (max) => {
    return Math.floor(Math.random() * max) + 1
}

export const randomArrayElement = (arr, mode = "element") => {
    if (mode === "element") {
        return arr[randomNumber(arr.length - 1)]
    }
    if (mode === "index") {
        return randomNumber(arr.length - 1)
    }
}

export function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const isItMyTurn = (user, room, teamTurn) => {
    // Проверяем наличие всех необходимых данных
    if (!user || !user.username) return false;
    if (!room || !room.matchState || !room.matchState.teams) return false;
    if (!teamTurn || !room.matchState.teams[teamTurn]) return false;

    return room.matchState.teams[teamTurn].player === user.username;
}