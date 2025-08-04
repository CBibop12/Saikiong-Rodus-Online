import { useEffect, useRef } from 'react';

export const useUserSocket = (onEvent) => {
    const wsRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('srUserToken');
        if (!token) return;

        const base = import.meta.env.VITE_WS_BASE || 'ws://localhost:4000';
        const socket = new WebSocket(`${base}/users?token=${token}`);

        wsRef.current = socket;

        socket.onopen = () => console.info('🔌 User WebSocket открыт');

        socket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                onEvent && onEvent(data);
            } catch (err) {
                console.error('Ошибка парсинга события userWS', err);
            }
        };

        socket.onerror = (err) => console.error('userWS error', err);
        socket.onclose = () => console.info('🔌 User WebSocket закрыт');

        return () => socket.close();
    }, []);

    return {};
}; 