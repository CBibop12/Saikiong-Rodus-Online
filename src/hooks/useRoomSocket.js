/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react';

export const useRoomSocket = (roomCode, onEvent) => {
    const wsRef = useRef(null);
    // Новый ref для хранения id интервала пинга
    const pingIntervalRef = useRef(null);

    useEffect(() => {
        if (!roomCode) return;

        const token = localStorage.getItem('srUserToken');
        const wsBase = import.meta.env.VITE_WS_BASE || 'wss://sr-game-backend-32667b36f309.herokuapp.com';
        const socket = new WebSocket(`${wsBase}/rooms/${roomCode}?token=${token}`);

        wsRef.current = socket;

        // Функция-помощник для очистки интервала
        const clearPing = () => {
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }
        };

        socket.onopen = () => {
            console.info('🔌 WebSocket открыт');
            // Запускаем периодический пинг каждые 25 секунд,
            // чтобы соединение не простаивало слишком долго
            pingIntervalRef.current = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    // Отправляем простое ping-сообщение, которое сервер
                    // может игнорировать. Главное — чтобы трафик шёл.
                    socket.send(JSON.stringify({ type: 'PING' }));
                }
            }, 25000);
        };

        socket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                // Игнорируем ответы сервера на пинг, если они есть
                if (data?.type === 'PONG' || data?.type === 'PING') return;
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
            // Чистим интервал при закрытии
            clearPing();
        };

        // При размонтировании закрываем соединение и очищаем интервал
        return () => {
            clearPing();
            socket.close();
        };
    }, [roomCode]);

    const emit = (type, payload) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const message = payload === undefined ? { type } : { type, payload };
            wsRef.current.send(JSON.stringify(message));
        }
    };

    return { emit };
}; 