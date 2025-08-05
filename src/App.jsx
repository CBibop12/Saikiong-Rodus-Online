import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainMenu from './components/MainMenu.jsx';
import NewGame from './components/NewGame';
import ContinueGame from './components/ContinueGame';
import Rules from './components/Rules';
import Statistics from './components/Statistics';
import AuthGate from './components/components/AuthGate';
import Room from './components/Room';

function App() {
  return (
    <Router>
      <AuthGate>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/new-game" element={<NewGame />} />
          <Route path="/continue-game" element={<ContinueGame />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/room/:roomCode" element={<Room />} />
        </Routes>
      </AuthGate>
    </Router>
  );
}

export default App;
