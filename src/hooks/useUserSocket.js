/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react';

export const useUserSocket = (onEvent) => {
    const wsRef = useRef(null);
    const pingIntervalRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const retryAttemptRef = useRef(0);
    const onEventRef = useRef(onEvent);
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
            try { wsRef.current.close(); } catch { /* noop */ }
            wsRef.current = null;
        }
    };

    const scheduleReconnect = () => {
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
            console.info('🔌 User WebSocket открыт');
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
                if (data?.type === 'PONG' || data?.type === 'PING') return;
                onEventRef.current && onEventRef.current(data);
            } catch (err) {
                console.error('Ошибка парсинга события userWS', err);
            }
        };

        socket.onerror = (err) => console.error('userWS error', err);
        socket.onclose = () => {
            console.info('🔌 User WebSocket закрыт');
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
    }, []);

    return {};
}; 