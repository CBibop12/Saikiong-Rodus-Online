// components/AuthGate.tsx (React-Router v6)
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { popTokenFromUrl } from '../../utils/tokenFromUrl';
import PropTypes from 'prop-types';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://sr-game-backend-32667b36f309.herokuapp.com';

export default function AuthGate({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = popTokenFromUrl();
    if (!token) return;                 // открыли страницу напрямую

    axios.post(`${API_BASE}/auth/exchange`, { token })
      .then(() => {
        navigate('/');
        localStorage.setItem('srUserToken', token);
      })
      .catch(() => {
        navigate('/auth-error', { replace: true });
      });
  }, [navigate]);

  return <>{children}</>;
}

AuthGate.propTypes = {
  children: PropTypes.node,
};
