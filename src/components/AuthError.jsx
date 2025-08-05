import { useNavigate } from 'react-router-dom';
import '../styles/authError.css';

export default function AuthError() {
    const navigate = useNavigate();

    const handleReload = () => {
        window.location.reload();
    };

    const goHome = () => {
        navigate('/', { replace: true });
    };

    return (
        <div className="auth-error-container">
            <div className="auth-error-card">
                <h1 className="error-title">Ошибка авторизации</h1>
                <p className="error-description">
                    Не удалось подтвердить ваш токен. Возможно, срок его действия истёк или ссылка
                    была использована ранее.
                </p>
                <div className="error-buttons">
                    <button className="menu-button" onClick={handleReload}>
                        Перезагрузить
                    </button>
                    <button className="menu-button" onClick={goHome}>
                        Главное меню
                    </button>
                </div>
            </div>
        </div>
    );
} 