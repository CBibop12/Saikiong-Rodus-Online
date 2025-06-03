import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/styles.css';

// Находим корневой элемент, куда будет монтироваться приложение
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Не найден элемент с id 'root' в index.html");
}

// Создаем корневой контейнер React и рендерим приложение
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
