/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';

export const useRoomSocket = (roomCode, onEvent) => {
    const wsRef = useRef(null);
    const pingIntervalRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const retryAttemptRef = useRef(0);
    const roomCodeRef = useRef(roomCode);
    const onEventRef = useRef(onEvent);
    const isUnmountingRef = useRef(false);
    const openedAtRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const pendingQueueRef = useRef([]); // очередь для сообщений, отправляемых до открытия

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
            try {
                const current = wsRef.current;
                if (current.readyState === WebSocket.CONNECTING) {
                    const handleOpenThenClose = () => {
                        try { current.close(1000, 'cleanup'); } catch { /* noop */ }
                        current.removeEventListener('open', handleOpenThenClose);
                    };
                    current.addEventListener('open', handleOpenThenClose);
                } else {
                    current.close(1000, 'cleanup');
                }
            } catch { /* noop */ }
            wsRef.current = null;
        }
        setIsOpen(false);
    };

    const scheduleReconnect = () => {
        // экспоненциальная задержка до 10 секунд
        if (isUnmountingRef.current) return;
        const attempt = retryAttemptRef.current + 1;
        retryAttemptRef.current = attempt;
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
            connect();
        }, delay);
    };

    const flushQueue = () => {
        const socket = wsRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        while (pendingQueueRef.current.length > 0) {
            const msg = pendingQueueRef.current.shift();
            socket.send(JSON.stringify(msg));
        }
    };

    const connect = () => {
        const code = roomCodeRef.current;
        if (!code) return;

        const token = localStorage.getItem('srUserToken');
        const wsBase = import.meta.env.VITE_WS_BASE || 'wss://sr-game-backend-32667b36f309.herokuapp.com';
        const socket = new WebSocket(`${wsBase}/rooms/${code}?token=${token}`);

        wsRef.current = socket;

        socket.onopen = () => {
            openedAtRef.current = Date.now();
            retryAttemptRef.current = 0; // сбрасываем счётчик попыток
            setIsOpen(true);
            // heartbeat каждые 25 сек
            clearPing();
            pingIntervalRef.current = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'PING' }));
                }
            }, 25000);
            // отправляем всё, что скопилось до открытия
            flushQueue();
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

        socket.onclose = (evt) => {
            const lifetimeMs = openedAtRef.current ? Date.now() - openedAtRef.current : null;
            clearPing();
            setIsOpen(false);
            if (!isUnmountingRef.current && evt?.code !== 1000) {
                scheduleReconnect();
            }
        };
    };

    useEffect(() => {
        isUnmountingRef.current = false;
        connect();
        return () => {
            isUnmountingRef.current = true;
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            cleanupSocket();
            setTimeout(() => { isUnmountingRef.current = false; }, 0);
        };
    }, [roomCode]);

    const emit = (type, payload) => {
        const socket = wsRef.current;
        const message = payload === undefined ? { type } : { type, payload };
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            // накапливаем команду, чтобы отправить сразу после открытия
            pendingQueueRef.current.push(message);
        }
    };

    const close = () => {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        cleanupSocket();
    };

    return { emit, close, isOpen };
}; 