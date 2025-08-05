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
    console.log('room', room);
    console.log('teamTurn', teamTurn);
    console.log('user', user);
    console.log('room.matchState.teams[teamTurn].player', room.matchState.teams[teamTurn].player);
    console.log('user.username', user.username);
    console.log('room.matchState.teams[teamTurn].player === user.username', room.matchState.teams[teamTurn].player === user.username);
    return room.matchState.teams[teamTurn].player === user.username
}