import { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import { CHAT_BASE, getChatMessages, sendMessage } from '../routes';
import { useLang } from '../i18n/LanguageContext';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import "../styles/privateChat.css";

function PrivateChat({ chat, friendUsername, friendAvatar, onClose, currentUserId }) {
    const { lang } = useLang();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const [isFriendTyping, setIsFriendTyping] = useState(false);
    // Загрузка сообщений при смене чата
    useEffect(() => {
        if (chat?._id) {
            loadMessages();
        }
    }, [chat?._id]);

    // Прокрутка вниз при добавлении сообщений
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Подключение к сокету один раз
    useEffect(() => {
        if (socketRef.current) return;

        const socket = io(CHAT_BASE, {
            auth: {
                token: localStorage.getItem('srUserToken'),
            },
        });

        socket.on('connect_error', (err) => {
            console.error('WebSocket error:', err.message);
        });

        // Новое сообщение
        socket.on('new-message', (message) => {
            if (message.chatId === chat?._id) {
                setMessages((prev) => [...prev, message]);
            }
        });

        // Индикатор печати
        socket.on('user-typing', (data) => {
            if (data.chatId === chat?._id && data.userId !== currentUserId) {
                setIsFriendTyping(true);
            }
        });

        socket.on('user-stop-typing', (data) => {
            if (data.chatId === chat?._id && data.userId !== currentUserId) {
                setIsFriendTyping(false);
            }
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    // Присоединяемся к комнате конкретного чата
    useEffect(() => {
        if (!chat?._id || !socketRef.current) return;

        const socket = socketRef.current;
        const join = () => socket.emit('join-chat', chat._id);

        if (socket.connected) {
            join();
        } else {
            socket.once('connect', join);
        }

        return () => socket.off('connect', join);
    }, [chat?._id]);

    // Дебаунс для печати
    const typingTimeoutRef = useRef(null);

    const handleTyping = () => {
        if (!socketRef.current) return;

        socketRef.current.emit('typing', { chatId: chat._id });

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current.emit('stop-typing', { chatId: chat._id });
        }, 1000);
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            const chatData = await getChatMessages(chat._id);
            const messagesArray = Array.isArray(chatData) ? chatData : chatData?.messages || [];
            setMessages(messagesArray);
        } catch (err) {
            console.error('Ошибка загрузки сообщений:', err);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const text = newMessage.trim();
            if (socketRef.current) {
                socketRef.current.emit('send-message', { chatId: chat._id, text });
            } else {
                await sendMessage(chat._id, text);
                await loadMessages();
            }
            setNewMessage('');
        } catch (err) {
            console.error('Ошибка отправки сообщения:', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return lang === 'ru' ? 'Сегодня' : 'Today';
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return lang === 'ru' ? 'Вчера' : 'Yesterday';
        }
        return date.toLocaleDateString('ru-RU');
    };

    const groupMessagesByDate = (msgArray) => {
        const groups = {};
        if (!Array.isArray(msgArray)) return groups;

        msgArray.forEach((msg) => {
            const date = new Date(msg.createdAt).toDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    };

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="chat-window">
            <div className="chat-header">
                <div className="chat-title">
                    <div className="chat-avatar">
                        <img src={friendAvatar} alt={friendUsername} />
                    </div>
                    <h3>{friendUsername}</h3>
                </div>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            <div className="chat-messages">
                {loading ? (
                    <div className="loading">
                        {lang === 'ru' ? 'Загрузка сообщений...' : 'Loading messages...'}
                    </div>
                ) : (
                    <>
                        {Object.entries(messageGroups).map(([date, dayMessages]) => (
                            <div key={date} className="message-group">
                                <div className="date-separator">
                                    <div className="line"></div>
                                    <div className="date">{formatDate(dayMessages[0].createdAt)}</div>
                                    <div className="line"></div>
                                </div>
                                {dayMessages.map((message, idx) => (
                                    <div
                                        key={`${message.createdAt}-${idx}`}
                                        className={`message ${(message.sender?._id ?? message.sender) === currentUserId ? 'own' : 'other'
                                            }`}
                                    >
                                        <div className="message-bubble">
                                            <div className="message-content">{message.text}</div>
                                            <div className="message-time">{formatTime(message.createdAt)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        {messages.length === 0 && !loading && (
                            <div className="empty-chat">
                                {lang === 'ru' ? 'Сообщений пока нет. Начните беседу!' : 'No messages yet. Start the conversation!'}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                        {isFriendTyping && <div className="typing-indicator">{lang === 'ru' ? 'Печатает...' : 'Typing...'}</div>}
                    </>
                )}
            </div>

            <form className="chat-input-container" onSubmit={handleSendMessage}>
                <div className="chat-input-wrapper">
                <input
                    className="chat-input"
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                    }}
                    placeholder={lang === 'ru' ? 'Введите сообщение...' : 'Type a message...'}
                    disabled={sending}
                />
                    <button className="send-btn" type="submit" disabled={!newMessage.trim() || sending}>
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}

PrivateChat.propTypes = {
    chat: PropTypes.object.isRequired,
    friendUsername: PropTypes.string.isRequired,
    friendAvatar: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    currentUserId: PropTypes.string.isRequired,
};

export default PrivateChat; 