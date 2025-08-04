import { useState, useEffect, useRef } from 'react';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { encryptMessage, decryptMessage } from '../utils/encryption';
import '../styles/chatSidebar.css';

const ChatSidebar = ({ roomCode, currentUser }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const bottomRef = useRef(null);

    const handleSocketEvent = (data) => {
        if (data.type === 'CHAT_MESSAGE') {
            const { encrypted, from } = data.payload;
            const plain = decryptMessage(encrypted);
            setMessages((prev) => [...prev, { text: plain, from }]);
        }
        if (data.type === 'ROOM_KEY') {
            // Сохраняем ключ сессии для шифрования
            if (data.payload?.key) {
                sessionStorage.setItem('srRoomKey', data.payload.key);
            }
        }
    };

    const { emit } = useRoomSocket(roomCode, handleSocketEvent);

    const sendMessage = () => {
        const txt = input.trim();
        if (!txt) return;
        const encrypted = encryptMessage(txt);
        emit('CHAT_MESSAGE', { encrypted });
        setMessages((prev) => [...prev, { text: txt, from: currentUser?.username || 'me' }]);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <aside className="chat-sidebar">
            <div className="chat-messages">
                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        className={
                            m.from === currentUser?.username ? 'chat-message self' : 'chat-message'
                        }
                    >
                        <span className="author">{m.from}</span>
                        <span className="text">{m.text}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Сообщение..."
                />
                <button onClick={sendMessage}>➤</button>
            </div>
        </aside>
    );
};

export default ChatSidebar; 