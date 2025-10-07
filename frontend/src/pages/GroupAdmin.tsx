import React, { useState } from "react";
import { Link } from "react-router-dom";
import ThickBorderCard from "../components/ui/ThickBorderCard";
import ThickBorderButton from "../components/ui/ThickBorderButton";
import ThickBorderInput from "../components/ui/ThickBorderInput";
import ThickBorderCheckbox from "../components/ui/ThickBorderCheckbox";
import ThickBorderCircle from "../components/ui/ThickBorderCircle";
import ThickBorderError from "../components/ui/ThickBorderError";

interface Participant {
  id: number;
  name: string;
}

interface Group {
  id: number;
  participants: number;
  name?: string;
  members?: Participant[];
}

interface MovingParticipant {
  participant: Participant;
  fromGroupId: number;
}

const GroupAdmin: React.FC = () => {
  const [numberOfGroups, setNumberOfGroups] = useState("");
  const [participantsPerGroup, setParticipantsPerGroup] = useState("");
  const [isPlayer, setIsPlayer] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [movingParticipant, setMovingParticipant] = useState<MovingParticipant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleMoveParticipant = (toGroupId: number) => {
    if (!movingParticipant) return;

    // Vérifier si le groupe de destination est plein
    const targetGroup = groups.find(g => g.id === toGroupId);
    if (targetGroup && (targetGroup.members?.length || 0) >= 3) {
      setErrorMessage("Ce groupe est complet. Vous devez remplacer un joueur existant.");
      return;
    }

    // Vérifier si le joueur existe déjà dans un autre groupe
    const isPlayerDuplicate = groups.some(group => 
      group.id !== movingParticipant.fromGroupId && 
      group.id !== toGroupId && 
      group.members?.some(m => m.id === movingParticipant.participant.id)
    );

    if (isPlayerDuplicate) {
      setErrorMessage("Ce joueur existe déjà dans un autre groupe");
      return;
    }

    setGroups(currentGroups => {
      return currentGroups.map(group => {
        if (group.id === movingParticipant.fromGroupId) {
          const updatedMembers = group.members?.filter(m => m.id !== movingParticipant.participant.id);
          return {
            ...group,
            members: updatedMembers,
            participants: (updatedMembers?.length || 0)
          };
        }
        if (group.id === toGroupId) {
          const updatedMembers = [...(group.members || []), movingParticipant.participant];
          return {
            ...group,
            members: updatedMembers,
            participants: updatedMembers.length
          };
        }
        return group;
      });
    });
    setMovingParticipant(null);
    setErrorMessage(null);
  };

  const handleNumberOfGroups = (value: string) => {
    const number = parseInt(value);
    if (value === "") {
      setNumberOfGroups("");
    } else if (!isNaN(number) && number >= 0 && number <= 15) {
      setNumberOfGroups(number.toString());
    }
  };

  const handleParticipantsPerGroup = (value: string) => {
    const number = parseInt(value);
    if (value === "") {
      setParticipantsPerGroup("");
    } else if (!isNaN(number) && number >= 0 && number <= 3) {
      setParticipantsPerGroup(number.toString());
    }
  };
  const gameCode = "ABCXYZ";

  return (
    <div className="relative w-full h-screen p-8">
      <div className="absolute top-8 right-8 flex flex-col items-center gap-4">
        <ThickBorderCard>
          {gameCode}
        </ThickBorderCard>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <ThickBorderButton>
            Démarrer
          </ThickBorderButton>
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center h-full gap-8 max-w-md mx-auto">
        <p className="text-sm text-gray-500">Maximum de 45 participants</p>
        
        {errorMessage && (
          <ThickBorderError
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
            className="w-full animate-fadeIn"
          />
        )}
        
        <div className="w-full space-y-6">
          <div className="flex flex-col gap-2">
            <label>Nombre de groupes</label>
            <ThickBorderInput
              type="number"
              min="0"
              max="15"
              value={numberOfGroups}
              onChange={(e) => handleNumberOfGroups(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label>Nombre de participants par groupes</label>
            <ThickBorderInput
              type="number"
              min="0"
              max="3"
              value={participantsPerGroup}
              onChange={(e) => handleParticipantsPerGroup(e.target.value)}
            />
          </div>

          <ThickBorderCheckbox
            label="Je fais partie des joueurs"
            checked={isPlayer}
            onChange={(e) => setIsPlayer(e.target.checked)}
          />

          <ThickBorderButton 
            className="w-full"
            onClick={() => {
              const numGroups = parseInt(numberOfGroups);
              const numParticipants = parseInt(participantsPerGroup);
              
              if (!numGroups || !numParticipants) {
                setErrorMessage("Veuillez remplir tous les champs");
                return;
              }

              const totalParticipants = numGroups * numParticipants;
              if (totalParticipants > 45) {
                setErrorMessage("Le nombre total de participants ne peut pas dépasser 45");
                return;
              }

              // Créer un tableau de tous les joueurs avec des IDs uniques
              const allParticipants = Array.from(
                { length: totalParticipants },
                (_, i) => ({
                  id: i + 1,
                  name: `Joueur ${i + 1}`
                })
              );

              // Répartir les joueurs dans les groupes
              const newGroups = Array.from({ length: numGroups }, (_, groupIndex) => {
                const startIndex = groupIndex * numParticipants;
                const groupMembers = allParticipants.slice(startIndex, startIndex + numParticipants);
                
                return {
                  id: groupIndex + 1,
                  participants: numParticipants,
                  name: `Groupe ${groupIndex + 1}`,
                  members: groupMembers
                };
              });

              setGroups(newGroups);
              setSelectedGroupId(null);
              setErrorMessage(null);
            }}
          >
            Créer aléatoirement les groupes
          </ThickBorderButton>
        </div>

        {/* Affichage des groupes */}
        {groups.length > 0 && (
          <div className="w-full mt-8">
            {/* Grille des groupes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {groups.map((group) => (
                <div 
                  key={group.id} 
                  className={`border-2 border-black rounded-lg p-4 flex flex-col gap-3 cursor-pointer transition-colors ${
                    selectedGroupId === group.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <div className="text-lg font-semibold text-center">
                    {group.name}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center justify-center min-h-[60px]">
                    {group.members?.map((member) => (
                      <ThickBorderCircle 
                        key={member.id}
                        size={28}
                        style={{ backgroundColor: 'white' }}
                        title={member.name}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Détails du groupe */}
            {selectedGroupId && (
              <>
                <div 
                  className="fixed inset-0" 
                  onClick={() => setSelectedGroupId(null)}
                />
                <div 
                  className="fixed right-0 top-0 h-full w-80 bg-white border-2 border-black p-6 z-10"
                  style={{ 
                    borderTopLeftRadius: '18px',
                    borderBottomLeftRadius: '18px',
                    borderRight: 'none'
                  }}
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">
                        {groups.find(g => g.id === selectedGroupId)?.name}
                      </h3>
                      <button 
                        onClick={() => setSelectedGroupId(null)}
                        className="text-2xl font-bold hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {groups.find(g => g.id === selectedGroupId)?.members?.map(member => (
                        <div key={member.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <ThickBorderCircle size={20} />
                            <span>{member.name}</span>
                          </div>
                          <button
                            onClick={() => setMovingParticipant({
                              participant: member,
                              fromGroupId: selectedGroupId
                            })}
                            className="text-xl font-bold hover:text-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Modal de sélection du nouveau groupe */}
            {movingParticipant && (
              <>
                <div 
                  className="fixed inset-0" 
                  onClick={() => setMovingParticipant(null)}
                />
                <div 
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white border-2 border-black p-6 z-20 rounded-lg"
                >
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-center">
                      Déplacer {movingParticipant.participant.name}
                    </h3>
                    <p className="text-center text-gray-600">
                      Choisissez un nouveau groupe
                    </p>
                    <div className="flex flex-col gap-2">
                      {groups
                        .filter(g => g.id !== movingParticipant.fromGroupId)
                        .map(group => (
                          <ThickBorderButton
                            key={group.id}
                            onClick={() => handleMoveParticipant(group.id)}
                            className="w-full"
                          >
                            {group.name}
                          </ThickBorderButton>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bouton retour */}
      <div className="absolute bottom-8 left-8">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <ThickBorderButton>
            Retour
          </ThickBorderButton>
        </Link>
      </div>
    </div>
  );
};

export default GroupAdmin;
