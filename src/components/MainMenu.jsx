import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Book, PlusCircle, BarChart2 } from 'lucide-react';
import "../styles/styles.css";
import advices from '../advices.json';

const MainMenu = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [adviceElement, setAdviceElement] = useState(Math.floor(Math.random() * advices.length));
  const [adviceIntervalId, setAdviceIntervalId] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;
    processFile(file);
  };

  useEffect(() => {
    let file = JSON.parse(localStorage.getItem("globalArray"))
    if (file) {
      processArray(file)
    }
  }, [])

  useEffect(() => {
    const intervalId = setInterval(changeAdvice, 15000);
    setAdviceIntervalId(intervalId);
    return () => clearInterval(intervalId);
  }, [])

  const processArray = (file) => {
    const inProcessRooms = file.filter(room => room.status === 'in_process');
    setRooms(inProcessRooms);
    setFileError('');
    setHasFile(true);

  };

  const changeAdvice = () => {
    if (adviceIntervalId) {
      clearInterval(adviceIntervalId);
    }
    setAdviceElement(Math.floor(Math.random() * advices.length));
    const newIntervalId = setInterval(changeAdvice, 15000);
    setAdviceIntervalId(newIntervalId);
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        const inProcessRooms = jsonData.filter(room => room.status === 'in_process');
        setRooms(inProcessRooms);
        setFileError('');
        setHasFile(true);
        localStorage.setItem("globalArray", JSON.stringify(jsonData))
      } catch (err) {
        console.error('Ошибка парсинга JSON:', err);
        setFileError('Невозможно прочитать файл JSON. Проверьте его формат.');
      }
    };
    reader.onerror = () => {
      setFileError('Ошибка при чтении файла.');
    };
    reader.readAsText(file);

  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="landing-container">
      <div className="left-section">
        <div className="logo-container">
          <img src="/assets/images/logo.png" alt="Logo" className="logo" />
          <div className="advice-carousel" onClick={() => changeAdvice()}>
            <h1>Добро пожаловать в игру</h1>
            <div id="advice-text" className="advice-text">{advices[adviceElement]}</div>
          </div>
        </div>
        <div
          className={`file-upload-zone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload size={48} className="upload-icon" color="#D4AF37" />
          <p>Перетащите JSON файл сюда или</p>
          <label htmlFor="jsonFile" className="file-upload-button">
            Выберите файл
          </label>
          <input
            type="file"
            id="jsonFile"
            accept="application/JSON"
            onChange={handleFileUpload}
            className="hidden-input"
          />
        </div>

        {fileError && <div className="error-message">{fileError}</div>}
        {hasFile && (
          <div className="rooms-list">
            <h2>Доступные партии (in process):</h2>
            {rooms.length > 0 ? (
              <ul className="rooms-grid">
                {rooms.map(room => (
                  <li key={room.id} className="room-card">
                    <span className="room-number">Игра {room.id}</span>
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      className="join-button"
                    >
                      Присоединиться
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-rooms">Нет доступных партий. Загрузите JSON файл или создайте новую игру.</p>
            )}
          </div>
        )}
      </div>

      <div className="right-section">
        <button className="menu-button create-button" onClick={() => navigate('/new-game')}>
          Создать комнату
        </button>

        <button className="menu-button rules-button" onClick={() => navigate('/rules')}>
          Ознакомиться с правилами
        </button>

        {hasFile && (
          <button className="menu-button stats-button" onClick={() => navigate('/statistics')}>
            <BarChart2 size={24} />
            Статистика
          </button>
        )}
      </div>
    </div>
  );
};

export default MainMenu;