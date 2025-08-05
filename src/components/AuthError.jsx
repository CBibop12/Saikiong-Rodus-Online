import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/authError.css';

export default function AuthError() {
    const navigate = useNavigate();

    const handleReload = () => {
        window.location.reload();
    };

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="auth-error-container">
            <div className="auth-error-content">
                <div className="error-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
                        <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" strokeWidth="2" />
                        <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" strokeWidth="2" />
                    </svg>
                </div>

                <h1 className="error-title">Ошибка авторизации</h1>

                <p className="error-description">
                    Не удалось выполнить авторизацию. Возможно, токен недействителен или истек срок его действия.
                </p>

                <div className="error-actions">
                    <button
                        className="btn btn-primary"
                        onClick={handleReload}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Перезагрузить страницу
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={handleGoHome}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Главное меню
                    </button>
                </div>

                <div className="error-help">
                    <p>Если проблема повторяется, попробуйте:</p>
                    <ul>
                        <li>Очистить кэш браузера</li>
                        <li>Проверить интернет-соединение</li>
                        <li>Обратиться к администратору</li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 