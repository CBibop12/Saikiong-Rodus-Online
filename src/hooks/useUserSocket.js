/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react';

export const useUserSocket = (onEvent) => {
    const wsRef = useRef(null);
    const pingIntervalRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const retryAttemptRef = useRef(0);
    const onEventRef = useRef(onEvent);
    const isUnmountingRef = useRef(false);
    const openedAtRef = useRef(null);
    onEventRef.current = onEvent;

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
    };

    const scheduleReconnect = () => {
        if (isUnmountingRef.current) return;
        const attempt = retryAttemptRef.current + 1;
        retryAttemptRef.current = attempt;
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
            connect();
        }, delay);
    };

    const connect = () => {
        const token = localStorage.getItem('srUserToken');
        if (!token) return;

        const base = import.meta.env.VITE_WS_BASE || 'wss://sr-game-backend-32667b36f309.herokuapp.com';
        const socket = new WebSocket(`${base}/users?token=${token}`);
        wsRef.current = socket;

        socket.onopen = () => {
            openedAtRef.current = Date.now();
            retryAttemptRef.current = 0;
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
                if (data?.type === 'PONG' || data?.type === 'PING') {
                    return;
                }
                onEventRef.current && onEventRef.current(data);
            } catch (err) {
                console.error('Ошибка парсинга события userWS', err);
            }
        };

        socket.onerror = (err) => console.error('userWS error', err);
        socket.onclose = (evt) => {
            const lifetimeMs = openedAtRef.current ? Date.now() - openedAtRef.current : null;
            clearPing();
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
    }, []);

    return {};
}; 