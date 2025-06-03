import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainMenu from './components/MainMenu.jsx';
import NewGame from './components/NewGame';
import ContinueGame from './components/ContinueGame';
import Rules from './components/Rules';
import Statistics from './components/Statistics';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/new-game" element={<NewGame />} />
        <Route path="/continue-game" element={<ContinueGame />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/statistics" element={<Statistics />} />
      </Routes>
    </Router>
  );
}

export default App;
