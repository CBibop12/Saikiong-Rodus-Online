/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react';

export const useRoomSocket = (roomCode, onEvent) => {
    const wsRef = useRef(null);
    const pingIntervalRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const retryAttemptRef = useRef(0);
    const roomCodeRef = useRef(roomCode);
    const onEventRef = useRef(onEvent);

    onEventRef.current = onEvent;
    roomCodeRef.current = roomCode;

    const clearPing = () => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
    };

    const cleanupSocket = () => {
        clearPing();
        if (wsRef.current) {
            try { wsRef.current.close(); } catch { /* noop */ }
            wsRef.current = null;
        }
    };

    const scheduleReconnect = () => {
        // экспоненциальная задержка до 10 секунд
        const attempt = retryAttemptRef.current + 1;
        retryAttemptRef.current = attempt;
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
            connect();
        }, delay);
    };

    const connect = () => {
        const code = roomCodeRef.current;
        if (!code) return;

        const token = localStorage.getItem('srUserToken');
        const wsBase = import.meta.env.VITE_WS_BASE || 'wss://sr-game-backend-32667b36f309.herokuapp.com';
        const socket = new WebSocket(`${wsBase}/rooms/${code}?token=${token}`);

        wsRef.current = socket;

        socket.onopen = () => {
            console.info('🔌 Room WebSocket открыт');
            retryAttemptRef.current = 0; // сбрасываем счётчик попыток
            // heartbeat каждые 25 сек
            clearPing();
            pingIntervalRef.current = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'PING' }));
                }
            }, 25000);
        };

        socket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data?.type === 'PONG' || data?.type === 'PING') return;
                onEventRef.current && onEventRef.current(data);
            } catch (err) {
                console.error('Ошибка парсинга сообщения WebSocket', err);
            }
        };

        socket.onerror = (err) => {
            console.error('Room WebSocket error', err);
        };

        socket.onclose = () => {
            console.info('🔌 Room WebSocket закрыт');
            clearPing();
            scheduleReconnect();
        };
    };

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            cleanupSocket();
        };
    }, [roomCode]);

    const emit = (type, payload) => {
        const socket = wsRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
            const message = payload === undefined ? { type } : { type, payload };
            socket.send(JSON.stringify(message));
        }
    };

    const close = () => {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        cleanupSocket();
    };

    return { emit, close };
}; 