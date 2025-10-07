import React, { useState } from "react";
import { Link } from "react-router-dom";
import ThickBorderButton from "../components/ui/ThickBorderButton";
import ThickBorderCard from "../components/ui/ThickBorderCard";

const Dashboard: React.FC = () => {
  const gameCode = "ABCXYZ"; // À remplacer par le vrai code plus tard
  const [showPopup, setShowPopup] = useState(true);

  return (
    <div className="relative w-full h-screen p-8">
      {/* En-tête avec le code de la partie */}
      <div className="absolute top-8 right-8">
        <ThickBorderCard>
          {gameCode}
        </ThickBorderCard>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col items-center justify-center h-full gap-8">
        <h1 className="text-4xl font-bold mb-8">Tableau de bord</h1>
        
        <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
          <ThickBorderCard className="p-6">
            <h2 className="text-xl font-bold mb-4">État de la partie</h2>
            <div className="space-y-2">
              <p>Temps écoulé: 00:00</p>
              <p>Progression: 0%</p>
            </div>
          </ThickBorderCard>

          <ThickBorderCard className="p-6">
            <h2 className="text-xl font-bold mb-4">Statistiques des groupes</h2>
            <div className="space-y-2">
              <p>Groupes actifs: 0</p>
              <p>Meilleur score: --</p>
            </div>
          </ThickBorderCard>
        </div>
      </div>

      {/* Bouton retour */}
      <div className="absolute bottom-8 left-8">
        <Link to="/groupadmin" style={{ textDecoration: 'none' }}>
          <ThickBorderButton>
            Retour
          </ThickBorderButton>
        </Link>
      </div>
      
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg border-4 border-black relative w-3/4 max-w-3xl">
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-2xl font-bold hover:text-gray-600"
            >
              ×
            </button>
            <div className="mt-4">
              abcd
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
