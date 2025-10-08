import React from 'react';
import ThickBorderCard from '../components/ui/ThickBorderCard';

const Endgame: React.FC = () => {
  return (
    <div className="w-full h-screen p-8 bg-white">
      <div className="flex flex-col gap-8">
        {/* Timer */}
        <div className="absolute top-8 right-8 text-4xl font-bold">
          58:25
        </div>

        {/* Cartes d'information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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

        {/* Zone de notifications */}
        <div className="fixed bottom-8 right-8 w-80 space-y-2">
          <div className="bg-white p-4 border-2 border-black rounded-lg text-sm">
            Le groupe "MEGATRON" a réussi le défi "un mystère en pierres"
          </div>
          <div className="bg-white p-4 border-2 border-black rounded-lg text-sm">
            Le groupe "Traleiro Tralala" a réussi le défi "le mur d'armures". Il y a 57 secondes
          </div>
        </div>

        {/* Zone de chat */}
        <div className="fixed bottom-8 w-96 mx-auto left-1/2 transform -translate-x-1/2">
          <div className="bg-white border-2 border-black rounded-lg p-4">
            <div className="space-y-2 mb-4">
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <p>J'ai presque fini mon défi, vous en êtes où ? Besoin d'aide ?</p>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                <p>Pour ma part, je n'ai pas de blocage...</p>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <p>Je suis 1 peux ko/nssé moi... Je veux bien de l'aide stp</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border-2 border-black rounded p-2"
                placeholder="Votre message..."
              />
              <button className="bg-white border-2 border-black rounded p-2 hover:bg-gray-100">
                →
              </button>
            </div>
            <div className="flex gap-2 mt-2 justify-center">
              {['green', 'white', 'red', 'red', 'green', 'green'].map((color, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    color === 'green' ? 'bg-green-500' :
                    color === 'red' ? 'bg-red-500' : 'bg-white border-2 border-black'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Endgame;