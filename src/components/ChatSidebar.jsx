import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { encryptMessage, decryptMessage } from '../utils/encryption';
import '../styles/chatSidebar.css';

const ChatSidebar = ({ roomCode, currentUser }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const bottomRef = useRef(null);

    // Множество для дедупликации сообщений (по id, иначе по encrypted)
    const seenIdsRef = useRef(new Set());
    const seenHashesRef = useRef(new Set());

    const appendMessage = (msg) => {
        setMessages((prev) => [...prev, msg]);
    };

    const handleSocketEvent = (data) => {
        if (data.type === 'CHAT_MESSAGE') {
            const payload = data.payload || {};
            const { id, encrypted, from, timestamp } = payload;

            // Дедуп по id
            if (id && seenIdsRef.current.has(id)) return;
            if (id) seenIdsRef.current.add(id);

            // Дедуп по самому зашифрованному тексту (на случай отсутствия id)
            if (!id) {
                const hash = encrypted;
                if (seenHashesRef.current.has(hash)) return;
                seenHashesRef.current.add(hash);
            }

            const plain = decryptMessage(encrypted);
            appendMessage({
                id: id || `${Date.now()}-${Math.random()}`,
                text: plain,
                from: from || 'Неизвестно',
                timestamp: timestamp || Date.now(),
            });
        }
        if (data.type === 'ROOM_KEY') {
            const key = typeof data.payload === 'string' ? data.payload : data.payload?.key;
            if (key) {
                sessionStorage.setItem('srRoomKey', key);
            }
        }
        if (data.type === 'ROOM_CHAT_HISTORY') {
            const history = Array.isArray(data.payload) ? data.payload : [];
            history.forEach((h) => {
                const { id, encrypted, from, timestamp } = h || {};
                if (id && seenIdsRef.current.has(id)) return;
                if (id) seenIdsRef.current.add(id);
                const hash = encrypted;
                if (!id && seenHashesRef.current.has(hash)) return;
                if (!id) seenHashesRef.current.add(hash);
                const plain = decryptMessage(encrypted);
                appendMessage({ id: id || `${Date.now()}-${Math.random()}`, text: plain, from: from || 'Неизвестно', timestamp: timestamp || Date.now() });
            });
        }
    };

    const { emit, isOpen } = useRoomSocket(roomCode, handleSocketEvent);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!roomCode) return;
        // Запрашиваем историю только когда соединение открыто
        if (isOpen) {
            emit('ROOM_CHAT_HISTORY_REQUEST');
        }
    }, [roomCode, isOpen]);

    const sendMessage = () => {
        const txt = input.trim();
        if (!txt) return;
        const encrypted = encryptMessage(txt);
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        emit('CHAT_MESSAGE', { id, encrypted });
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (ts) => {
        try {
            const d = new Date(ts);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const isSelf = (author) => author === (currentUser?.username || '');

    return (
        <aside className="sr-room-chat">
            <div className="pause-chat-header">
                <h3>Чат комнаты</h3>
            </div> 
            <div className="sr-room-chat__messages">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`sr-room-chat__message${isSelf(m.from) ? ' self' : ''}`}
                    >
                        <div className="sr-room-chat__author-row">
                            <span className="sr-room-chat__author">{m.from}</span>
                            <span className="sr-room-chat__time">{formatTime(m.timestamp)}</span>
                        </div>
                        <div className="sr-room-chat__text">{m.text}</div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="sr-room-chat__input">
                <input
                    className="sr-room-chat__field"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Сообщение..."
                />
                <button className="sr-room-chat__send" onClick={sendMessage}>➤</button>
            </div>
        </aside>
    );
};

ChatSidebar.propTypes = {
    roomCode: PropTypes.string,
    currentUser: PropTypes.shape({
        username: PropTypes.string,
    }),
};

export default ChatSidebar; 