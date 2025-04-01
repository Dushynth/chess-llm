import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import ChessBoardApp from './ChessBoardApp';
import LLMChess from './LLMChess';

const homeStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  gap: '2rem',
  backgroundColor: '#f8f8f8',
  fontFamily: 'Arial',
};

const Home = () => {
  const navigate = useNavigate();
  return (
    <div style={homeStyle}>
      <h1>Chess</h1>
      <button onClick={() => navigate('/1v1')} style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>
        1 v 1
      </button>
      <button onClick={() => navigate('/vs-llm')} style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>
        1 v LLM
      </button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/1v1" element={<ChessBoardApp />} />
        <Route path="/vs-llm" element={<LLMChess />} />
      </Routes>
    </Router>
  );
}

export default App;
