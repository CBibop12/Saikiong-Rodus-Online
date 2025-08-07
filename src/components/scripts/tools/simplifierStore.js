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
    try {
        const username = user && typeof user === 'object' ? user.username : undefined;
        if (!username) return false;
        const teams = room && room.matchState && room.matchState.teams ? room.matchState.teams : undefined;
        if (!teams || !teamTurn || !teams[teamTurn]) return false;
        return teams[teamTurn].player === username;
    } catch {
        return false;
    }
}