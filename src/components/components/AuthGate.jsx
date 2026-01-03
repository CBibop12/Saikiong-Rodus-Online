// components/AuthGate.tsx (React-Router v6)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { popTokenFromUrl } from '../../utils/tokenFromUrl';
import PropTypes from 'prop-types';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://saikiong-rodus-08b1dee9bafb.herokuapp.com';

export default function AuthGate({ children }) {
  const navigate = useNavigate();
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState('');

  useEffect(() => {
    const token = popTokenFromUrl();
    if (!token) return;                 // открыли страницу напрямую

    setIsExchanging(true);
    setExchangeError('');
    axios.post(`${API_BASE}/auth/exchange`, { token })
      .then(() => {
        // Важно: сначала сохраняем токен, потом навигация.
        // Иначе компоненты (например MainMenu) могут смонтироваться и прочитать localStorage
        // до того, как токен будет записан, и "залипнуть" в состоянии "токен не найден".
        localStorage.setItem('srUserToken', token);
        navigate('/', { replace: true });
      })
      .catch(() => {
        navigate('/auth-error', { replace: true });
        setExchangeError('Не удалось выполнить авторизацию по ссылке. Попробуйте открыть ссылку ещё раз.');
      })
      .finally(() => {
        setIsExchanging(false);
      });
  }, [navigate]);

  if (isExchanging) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          color: '#fff',
          background: '#0b0b10',
          textAlign: 'center',
        }}
      >
        Выполняется авторизация…
      </div>
    );
  }

  if (exchangeError) {
    // В норме мы уже уйдём на /auth-error, но на всякий случай даём фидбек.
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          color: '#fff',
          background: '#0b0b10',
          textAlign: 'center',
        }}
      >
        {exchangeError}
      </div>
    );
  }

  return <>{children}</>;
}

AuthGate.propTypes = {
  children: PropTypes.node,
};
