import React, { useEffect, useState } from 'react';
import '../styles/Notification.css';

const Notification = ({ message, type }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`notification ${type}`}>
      {message}
    </div>
  );
};

export default Notification; 