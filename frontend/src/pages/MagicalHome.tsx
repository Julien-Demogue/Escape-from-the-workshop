import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import partyService from "../services/partyService";
import MagicalButton from "../components/ui/MagicalButton";
import MagicalInput from "../components/ui/MagicalInput";
import MagicalCard from "../components/ui/MagicalCard";

const MagicalHome = () => {
  const [gameCode, setGameCode] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string, duration = 3000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleCreateQuest = async () => {
    try {
      setCreating(true);
      // Create party with minimal payload (server can fill defaults)
      const party = await partyService.createParty({});
      // persist party id (and full party) for later use
      if (party?.id) {
        // pass id via URL
        navigate(`/groupadmin/${party.id}`);
      } else {
        // fallback if API returns unexpected payload
        setCreating(false);
        showToast("Une erreur est survenue durant la création de la quête.");
      }
    } catch (err) {
      console.error("Erreur création de la quête :", err);
      setCreating(false);
      showToast("Échec de la création de la quête. Réessayez plus tard.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 via-amber-900 to-stone-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fond d'étoiles magiques */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-200 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
              opacity: 0.3 + Math.random() * 0.7
            }}
          />
        ))}
      </div>

      {/* Château en arrière-plan */}
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-10"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/32445519/pexels-photo-32445519.jpeg)',
        }}
      />

      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Titre magique */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 font-serif mb-4 animate-pulse">
            Escape Game
          </h1>
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 font-serif mb-6">
            Les Secrets de la Loire
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-4"></div>
          <p className="text-amber-200 text-lg font-serif max-w-lg mx-auto leading-relaxed">
            Plongez dans les mystères des châteaux de la Loire et découvrez les secrets cachés
            de contes oubliés...
          </p>
        </div>

        {/* Carte principale */}
        <MagicalCard variant="parchment" className="backdrop-blur-sm bg-opacity-90">
          <div className="space-y-8">
            {/* Section création de partie */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-amber-900 font-serif mb-6 flex items-center justify-center gap-2">
                <span className="text-yellow-600">✦</span>
                Commencer l'Aventure
                <span className="text-yellow-600">✦</span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-6 items-stretch">
                {/* Créer une partie */}
                <div className="flex-1">
                  <MagicalButton
                    variant="magical"
                    className="w-full py-4 text-lg"
                    onClick={handleCreateQuest}
                    disabled={creating}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>🏰</span>
                      {creating ? "Création..." : "Créer une Quête"}
                    </span>
                  </MagicalButton>
                </div>

                {/* Divider magique */}
                <div className="flex items-center justify-center sm:flex-col gap-2">
                  <div className="w-12 h-px sm:w-px sm:h-12 bg-gradient-to-r sm:bg-gradient-to-b from-transparent via-amber-400 to-transparent"></div>
                  <span className="text-amber-600 font-serif text-sm">ou</span>
                  <div className="w-12 h-px sm:w-px sm:h-12 bg-gradient-to-r sm:bg-gradient-to-b from-transparent via-amber-400 to-transparent"></div>
                </div>

                {/* Rejoindre une partie */}
                <div className="flex-1 space-y-4">
                  <MagicalInput
                    type="text"
                    placeholder="Code de la quête..."
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value)}
                    className="text-center"
                  />
                  <MagicalButton
                    variant="primary"
                    className="w-full py-4 text-lg"
                    disabled={!gameCode.trim()}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>⚔️</span>
                      Rejoindre la Quête
                    </span>
                  </MagicalButton>
                </div>
              </div>
            </div>

            {/* Informations sur le jeu */}
            <div className="border-t border-amber-300 pt-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="text-3xl">🏰</div>
                  <h4 className="font-bold text-amber-800 font-serif">Châteaux Légendaires</h4>
                  <p className="text-sm text-amber-700">Explorez Chambord, Brissac et d'autres merveilles</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl">🧚‍♂️</div>
                  <h4 className="font-bold text-amber-800 font-serif">Magie Ancienne</h4>
                  <p className="text-sm text-amber-700">Découvrez les secrets des farfadets et des contes</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl">🗺️</div>
                  <h4 className="font-bold text-amber-800 font-serif">Carte Interactive</h4>
                  <p className="text-sm text-amber-700">Naviguez sur la Loire mystérieuse</p>
                </div>
              </div>
            </div>
          </div>
        </MagicalCard>

        {/* Navigation supplémentaire */}
        <div className="mt-8 text-center">
          <Link to="/about">
            <MagicalButton variant="secondary" className="inline-flex items-center gap-2">
              <span>📜</span>
              À propos de cette aventure
            </MagicalButton>
          </Link>
        </div>
      </div>

      {/* Effet de particules en mouvement */}
      <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none">
        <div className="relative w-full h-full overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 w-2 h-2 bg-gradient-to-t from-amber-400 to-transparent rounded-full opacity-50"
              style={{
                left: `${i * 12.5}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Toast d'erreur */}
      {toastMessage && (
        <div className="fixed left-1/2 transform -translate-x-1/2 bottom-8 z-50">
          <div className="toast">{toastMessage}</div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .toast {
          background: rgba(20,20,20,0.9);
          color: #fff;
          padding: 0.6rem 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 6px 18px rgba(0,0,0,0.4);
          font-weight: 600;
          backdrop-filter: blur(4px);
          animation: toast-in 200ms ease;
        }
        @keyframes toast-in {
          from { transform: translateY(8px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MagicalHome;