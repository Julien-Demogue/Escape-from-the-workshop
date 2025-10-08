import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MagicalButton from "../components/ui/MagicalButton";
import MagicalInput from "../components/ui/MagicalInput";
import MagicalCard from "../components/ui/MagicalCard";
import chambordBlason from "../assets/images/blason/blason-chambord.png";

const CORRECT_ANSWER = 300;
const ACCEPT_TOLERANCE = 0;

export default function MagicalChambordEnigmaFixed() {
  const navigate = useNavigate();
  const [value, setValue] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [tries, setTries] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const parsed = useMemo(() => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }, [value]);

  function check() {
    if (parsed === null) return;
    const ok = Math.abs(parsed - CORRECT_ANSWER) <= ACCEPT_TOLERANCE;
    setStatus(ok ? "correct" : "wrong");
    setTries((t) => t + 1);
  }

  function reset() {
    setValue("");
    setStatus("idle");
    setTries(0);
    setShowHint(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 via-amber-900 to-stone-900 p-4 relative overflow-hidden">
      {/* Fond d'etoiles magiques */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
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

      {/* Bouton retour magique */}
      <div className="absolute top-6 left-6 z-20">
        <MagicalButton 
          variant="secondary" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <span>←</span>
          Retour à la Carte
        </MagicalButton>
      </div>

      {/* Contenu principal centre */}
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-4xl">
          {/* Titre magique */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 font-serif mb-4 animate-pulse">
              🏰 Château de Chambord 🏰
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-amber-300 font-serif">
              Énigme III - L'Emblème Royal
            </h2>
          </div>

          {/* Carte principale */}
          <MagicalCard variant="parchment" className="backdrop-blur-sm bg-opacity-95">
            <div className="space-y-8">
              {/* Enigme avec parchemin decoratif */}
              <div className="relative">
                <div className="text-center p-6 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 rounded-lg border-2 border-amber-400 shadow-inner">
                  <div className="text-xl font-serif text-amber-900 italic leading-relaxed">
                    <span className="text-3xl text-amber-600">"</span>
                    Je renais toujours des flammes. Cherche mon emblème dans les murs du château.
                    Combien de fois suis-je représenté ?
                    <span className="text-3xl text-amber-600">"</span>
                  </div>
                </div>
                
                {/* Coins decoratifs */}
                <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4 border-amber-600"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4 border-amber-600"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4 border-amber-600"></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4 border-amber-600"></div>
              </div>

              {/* Image du blason avec effet magique */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-yellow-400/20 rounded-lg blur animate-pulse"></div>
                  <img
                    src={chambordBlason}
                    alt="Blason de Chambord"
                    className="relative z-10 max-h-64 rounded-lg border-2 border-amber-400 shadow-xl magical-hover"
                  />
                </div>
              </div>

              {/* Section reponse */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-amber-800 font-serif mb-4 flex items-center justify-center gap-2">
                    <span className="text-yellow-600">✦</span>
                    Votre Réponse
                    <span className="text-yellow-600">✦</span>
                  </h3>
                </div>

                <div className="max-w-md mx-auto">
                  <MagicalInput
                    type="number"
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Entrez le nombre de salamandres..."
                    label="Nombre d'emblèmes trouvés :"
                    className="text-center text-lg"
                  />
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-wrap gap-4 justify-center">
                  <MagicalButton 
                    variant="magical" 
                    onClick={check} 
                    disabled={parsed === null}
                    className="px-8 py-3 text-lg"
                  >
                    <span className="flex items-center gap-2">
                      <span>🔮</span>
                      Valider la Réponse
                    </span>
                  </MagicalButton>
                  
                  <MagicalButton 
                    variant="secondary" 
                    onClick={() => setShowHint((s) => !s)}
                    className="px-6 py-3"
                  >
                    <span className="flex items-center gap-2">
                      <span>💡</span>
                      {showHint ? "Masquer l'Indice" : "Révéler un Indice"}
                    </span>
                  </MagicalButton>
                  
                  <MagicalButton 
                    variant="secondary" 
                    onClick={reset}
                    className="px-6 py-3"
                  >
                    <span className="flex items-center gap-2">
                      <span>🔄</span>
                      Recommencer
                    </span>
                  </MagicalButton>
                </div>
              </div>

              {/* Indice magique */}
              {showHint && (
                <MagicalCard variant="magical" className="transform animate-pulse">
                  <div className="text-center space-y-3">
                    <h4 className="font-bold text-purple-800 font-serif flex items-center justify-center gap-2">
                      <span>🔍</span>
                      Indice Mystique
                      <span>🔍</span>
                    </h4>
                    <p className="text-purple-700 font-serif">
                      L'emblème est la <strong>salamandre</strong> de François I<sup>er</sup>,
                      créature légendaire qui renaît des flammes, souvent sculptée parmi 
                      les décors du château royal.
                    </p>
                  </div>
                </MagicalCard>
              )}

              {/* Resultat */}
              {status !== "idle" && (
                <MagicalCard 
                  variant={status === "correct" ? "magical" : "stone"}
                  className={`text-center transform animate-bounce ${
                    status === "correct" ? 'border-emerald-500' : 'border-red-500'
                  }`}
                >
                  {status === "correct" ? (
                    <div className="space-y-3">
                      <div className="text-4xl">🎉</div>
                      <h4 className="text-xl font-bold text-emerald-800 font-serif">
                        Bravo, Noble Aventurier !
                      </h4>
                      <p className="text-emerald-700">
                        Vous avez percé le mystère de l'emblème royal ! 
                        La salamandre de François I<sup>er</sup> n'a plus de secrets pour vous.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-4xl">🤔</div>
                      <h4 className="text-xl font-bold text-red-800 font-serif">
                        Pas tout à fait...
                      </h4>
                      <p className="text-red-700">
                        La réponse n'est pas correcte. Les salamandres sont partout 
                        dans le château... Cherchez plus attentivement ! 🔍
                      </p>
                    </div>
                  )}
                </MagicalCard>
              )}

              {/* Compteur de tentatives */}
              <div className="text-center text-amber-600 font-serif">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-lg border border-amber-300">
                  <span>📊</span>
                  Tentatives : {tries}
                </span>
              </div>
            </div>
          </MagicalCard>
        </div>
      </div>
    </div>
  );
}