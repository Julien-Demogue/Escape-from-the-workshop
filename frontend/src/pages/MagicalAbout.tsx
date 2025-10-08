import React from 'react';
import { useNavigate } from 'react-router-dom';
import MagicalButton from '../components/ui/MagicalButton';
import MagicalCard from '../components/ui/MagicalCard';

const MagicalAbout = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 via-amber-900 to-stone-900 p-4 relative overflow-hidden">
      {/* Fond d'étoiles magiques */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
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

      {/* Bouton retour */}
      <div className="absolute top-6 left-6 z-20">
        <MagicalButton 
          variant="secondary" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <span>←</span>
          Retour à l'Accueil
        </MagicalButton>
      </div>

      {/* Contenu principal */}
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Titre */}
          <div className="text-center">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 font-serif mb-4 animate-pulse">
              📚 À Propos 📚
            </h1>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 font-serif mb-6">
              Les Secrets de la Loire
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-8"></div>
          </div>

          {/* Contenu principal */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Histoire de l'escape game */}
            <MagicalCard variant="parchment" className="backdrop-blur-sm bg-opacity-95">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-amber-800 font-serif flex items-center gap-2">
                  <span>🏰</span>
                  L'Histoire
                </h3>
                <p className="text-amber-700 font-serif leading-relaxed">
                  Plongez dans une aventure extraordinaire à travers les châteaux légendaires 
                  de la Loire. Chaque château cache des secrets millénaires, des énigmes 
                  ancestrales et des mystères que seuls les plus courageux pourront élucider.
                </p>
                <p className="text-amber-700 font-serif leading-relaxed">
                  Des farfadets malicieux aux salamandres royales, en passant par les 
                  blasons mystérieux et les contes oubliés, votre quête vous mènera 
                  sur les traces d'un mystère bien gardé...
                </p>
              </div>
            </MagicalCard>

            {/* Objectifs */}
            <MagicalCard variant="magical" className="backdrop-blur-sm bg-opacity-95">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-purple-800 font-serif flex items-center gap-2">
                  <span>🎯</span>
                  Votre Mission
                </h3>
                <ul className="space-y-3 text-purple-700 font-serif">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">✦</span>
                    Explorez les châteaux de Chambord, Brissac et bien d'autres
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">✦</span>
                    Résolvez des énigmes basées sur l'histoire réelle de la Loire
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">✦</span>
                    Découvrez le conte mystérieux qui lie tous ces lieux
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">✦</span>
                    Collaborez en équipe pour percer le secret final
                  </li>
                </ul>
              </div>
            </MagicalCard>
          </div>

          {/* Fonctionnalités */}
          <MagicalCard variant="stone" className="backdrop-blur-sm bg-opacity-95">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-stone-800 font-serif text-center flex items-center justify-center gap-2">
                <span>⚔️</span>
                Fonctionnalités Magiques
                <span>⚔️</span>
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-4xl">🗺️</div>
                  <h4 className="font-bold text-stone-800 font-serif">Carte Interactive</h4>
                  <p className="text-sm text-stone-600 font-serif">
                    Naviguez sur une authentique carte de la Loire avec des 
                    animations magiques
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="text-4xl">👥</div>
                  <h4 className="font-bold text-stone-800 font-serif">Jeu Collaboratif</h4>
                  <p className="text-sm text-stone-600 font-serif">
                    Créez des équipes et communiquez en temps réel pour 
                    résoudre les énigmes
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="text-4xl">🧩</div>
                  <h4 className="font-bold text-stone-800 font-serif">Énigmes Variées</h4>
                  <p className="text-sm text-stone-600 font-serif">
                    Puzzles, quiz d'héraldique, jeux de mémoire et énigmes 
                    historiques authentiques
                  </p>
                </div>
              </div>
            </div>
          </MagicalCard>

          {/* Crédits */}
          <MagicalCard variant="parchment" className="backdrop-blur-sm bg-opacity-95">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-amber-800 font-serif flex items-center justify-center gap-2">
                <span>🏅</span>
                Crédits & Remerciements
                <span>🏅</span>
              </h3>
              <p className="text-amber-700 font-serif">
                Cet escape game a été créé avec passion pour faire découvrir 
                le riche patrimoine historique et culturel de la Loire.
              </p>
              <div className="flex justify-center gap-4 mt-6">
                <MagicalButton 
                  variant="magical" 
                  onClick={() => navigate('/')}
                  className="px-8 py-3"
                >
                  <span className="flex items-center gap-2">
                    <span>🚀</span>
                    Commencer l'Aventure
                  </span>
                </MagicalButton>
              </div>
            </div>
          </MagicalCard>
        </div>
      </div>
    </div>
  );
};

export default MagicalAbout;