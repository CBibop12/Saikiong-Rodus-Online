import { useEffect, useRef } from 'react';

export const useRoomSocket = (roomCode, onEvent) => {
    const wsRef = useRef(null);

    useEffect(() => {
        if (!roomCode) return;

        const token = localStorage.getItem('srUserToken');
        const wsBase = import.meta.env.VITE_WS_BASE || 'ws://localhost:4000';
        const socket = new WebSocket(`${wsBase}/rooms/${roomCode}?token=${token}`);

        wsRef.current = socket;

        socket.onopen = () => {
            console.info('🔌 WebSocket открыт');
        };

        socket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                onEvent && onEvent(data);
            } catch (err) {
                console.error('Ошибка парсинга сообщения WebSocket', err);
            }
        };

        socket.onerror = (err) => {
            console.error('WebSocket error', err);
        };

        socket.onclose = () => {
            console.info('🔌 WebSocket закрыт');
        };

        return () => socket.close();
    }, [roomCode]);

    const emit = (type, payload) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const message = payload === undefined ? { type } : { type, payload };
            wsRef.current.send(JSON.stringify(message));
        }
    };

    return { emit };
}; 