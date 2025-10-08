import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Timer: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('gameTimer');
    if (saved) {
      const diff = Date.now() - parseInt(saved);
      const secondsLeft = 3600 - Math.floor(diff / 1000);
      return Math.max(0, secondsLeft);
    }
    localStorage.setItem('gameTimer', Date.now().toString());
    return 3600; // 60 minutes en secondes
  });

  useEffect(() => {
    if (timeLeft === 0) {
      navigate('/endgame');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed top-4 right-4 bg-white border-2 border-black rounded-xl px-6 py-3 text-2xl font-bold" style={{ fontFamily: 'monospace' }}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
};

export default Timer;