import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackToDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate('/dashboard')}
      className="fixed top-8 right-8 w-10 h-10 bg-white border-2 border-black rounded-lg 
                 flex items-center justify-center hover:bg-gray-100 z-50"
      aria-label="Retour au tableau de bord"
    >
      <span className="text-2xl font-bold">×</span>
    </button>
  );
};

export default BackToDashboard;