import React, { useState } from 'react';
import '../styles/coinFlip.css';

const CoinFlipModal = ({ onResult, onClose }) => {
  const [flipClass, setFlipClass] = useState('');
  const [message, setMessage] = useState('Нажмите на монетку для броска');

  const handleCoinClick = () => {
    // Случайное число для определения результата
    const flipResult = Math.random();
    setFlipClass(''); // сброс анимации
    // Небольшая задержка для эффекта
    setTimeout(() => {
      if (flipResult <= 0.5) {
        setFlipClass('heads');
        setMessage('Выпали красные');
        onResult('red');
      } else {
        setFlipClass('tails');
        setMessage('Выпали синие');
        onResult('blue');
      }
    }, 100);
  };

  const handleManualSelect = (side) => {
    setFlipClass(side === 'red' ? 'heads' : 'tails');
    setMessage(side === 'red' ? 'Выбраны красные' : 'Выбраны синие');
    onResult(side);
  };

  return (
    <div className="modal-overlay">
      <div className="coin-modal">
        <div id="coin" className={flipClass} onClick={handleCoinClick}>
          <div className="side-a" />
          <div className="side-b" />
        </div>
        <h1>{message}</h1>
        <div className="manual-select">
          <button onClick={() => handleManualSelect('red')}>Выбрать красные</button>
          <button onClick={() => handleManualSelect('blue')}>Выбрать синие</button>
        </div>
        <button className="close-button" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
};

export default CoinFlipModal;
