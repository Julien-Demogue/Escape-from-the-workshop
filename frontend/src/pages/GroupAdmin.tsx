import React, { useState } from "react";
import { Link } from "react-router-dom";
import ThickBorderCard from "../components/ui/ThickBorderCard";
import ThickBorderButton from "../components/ui/ThickBorderButton";
import ThickBorderCheckbox from "../components/ui/ThickBorderCheckbox";
import ThickBorderCircle from "../components/ui/ThickBorderCircle";
import ThickBorderError from "../components/ui/ThickBorderError";
import ThickBorderInput from "../components/ui/ThickBorderInput";

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
  const [numberOfGroups, setNumberOfGroups] = useState("1");
  const [participantsPerGroup, setParticipantsPerGroup] = useState("1");
  const [isPlayer, setIsPlayer] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [movingParticipant, setMovingParticipant] = useState<MovingParticipant | null>(null);
  const [replacementMode, setReplacementMode] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);

  const handleMoveClick = (participant: Participant, fromGroupId: number) => {
    setMovingParticipant({ participant, fromGroupId });
    setShowMoveModal(true);
    setReplacementMode(false);
    setTargetGroupId(null);
  };

  const handleDeletePlayer = (groupId: number, participant: Participant) => {
    setGroups(currentGroups => {
      return currentGroups.map(group => {
        if (group.id === groupId) {
          const updatedMembers = group.members?.filter(m => m.id !== participant.id);
          return {
            ...group,
            members: updatedMembers,
            participants: (updatedMembers?.length || 0)
          };
        }
        return group;
      });
    });
  };



  const handleMoveParticipant = (toGroupId: number) => {
    if (!movingParticipant) return;

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

    const targetGroup = groups.find(g => g.id === toGroupId);
    if (targetGroup && (targetGroup.members?.length || 0) >= 3) {
      setReplacementMode(true);
      setTargetGroupId(toGroupId);
      return;
    }

    // Déplacer le joueur vers le nouveau groupe
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
    // Réinitialiser tous les états
    setMovingParticipant(null);
    setReplacementMode(false);
    setErrorMessage(null);
    setShowMoveModal(false);
  };

  const handleReplacePlayer = (groupId: number, playerToReplace: Participant) => {
    if (!movingParticipant) return;

    setGroups(currentGroups => {
      return currentGroups.map(group => {
        // Groupe source : retirer le joueur qui se déplace et ajouter le joueur remplacé
        if (group.id === movingParticipant.fromGroupId) {
          const filteredMembers = group.members?.filter(m => m.id !== movingParticipant.participant.id) || [];
          const updatedMembers = [...filteredMembers, playerToReplace];
          return {
            ...group,
            members: updatedMembers,
            participants: updatedMembers.length
          };
        }
        // Groupe cible : remplacer le joueur
        if (group.id === groupId) {
          const updatedMembers = group.members?.map(m => 
            m.id === playerToReplace.id ? movingParticipant.participant : m
          ) || [];
          return {
            ...group,
            members: updatedMembers,
            participants: updatedMembers.length
          };
        }
        return group;
      });
    });
    // Réinitialiser tous les états
    setMovingParticipant(null);
    setReplacementMode(false);
    setTargetGroupId(null);
    setErrorMessage(null);
    setShowMoveModal(false);
  };



  const handleNumberOfGroupsChange = (value: string) => {
    const number = parseInt(value);
    if (value === "") {
      setNumberOfGroups("");
    } else if (!isNaN(number)) {
      if (number < 1) {
        setNumberOfGroups("1");
      } else if (number > 15) {
        setNumberOfGroups("15");
      } else {
        setNumberOfGroups(number.toString());
      }
    }
  };

  const handleParticipantsPerGroupChange = (value: string) => {
    const number = parseInt(value);
    if (value === "") {
      setParticipantsPerGroup("");
    } else if (!isNaN(number)) {
      if (number < 1) {
        setParticipantsPerGroup("1");
      } else if (number > 3) {
        setParticipantsPerGroup("3");
      } else {
        setParticipantsPerGroup(number.toString());
      }
    }
  };
  const gameCode = "ABCXYZ";

  return (
    <div className="relative w-full min-h-screen p-8 overflow-y-auto">
      <div className="fixed top-8 right-8 flex flex-col items-center gap-4 z-20">
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
            <label htmlFor="numGroups">Nombre de groupes</label>
            <ThickBorderInput
              id="numGroups"
              type="number"
              min="1"
              max="15"
              value={numberOfGroups}
              onChange={(e) => handleNumberOfGroupsChange(e.target.value)}
              placeholder="Entre 1 et 15"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="numParticipants">Nombre de participants par groupes</label>
            <ThickBorderInput
              id="numParticipants"
              type="number"
              min="1"
              max="3"
              value={participantsPerGroup}
              onChange={(e) => handleParticipantsPerGroupChange(e.target.value)}
              placeholder="Entre 1 et 3"
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
              const numGroups = parseInt(numberOfGroups || "0");
              const numParticipants = parseInt(participantsPerGroup || "0");
              
              if (numberOfGroups === "" || participantsPerGroup === "") {
                setErrorMessage("Veuillez remplir tous les champs");
                return;
              }

              if (numGroups < 1 || numGroups > 15) {
                setErrorMessage("Le nombre de groupes doit être entre 1 et 15");
                return;
              }

              if (numParticipants < 1 || numParticipants > 3) {
                setErrorMessage("Le nombre de participants par groupe doit être entre 1 et 3");
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
                      <div
                        key={member.id}
                        className="relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveClick(member, group.id);
                        }}
                      >
                        <ThickBorderCircle 
                          size={28}
                          style={{ backgroundColor: 'white', cursor: 'pointer' }}
                          title={member.name}
                        />
                      </div>
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
                  className="fixed right-0 top-0 h-full w-80 bg-white border-2 border-black p-6 z-10 overflow-y-auto"
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
                        onClick={() => {
                          setSelectedGroupId(null);
                          setReplacementMode(false);
                          setTargetGroupId(null);
                        }}
                        className="text-2xl font-bold hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {groups.find(g => g.id === selectedGroupId)?.members?.map(member => (
                        <div key={member.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <ThickBorderCircle 
                              size={20}
                              style={{ 
                                backgroundColor: 
                                  replacementMode ? 'rgba(255, 255, 255, 0.7)' : 'white',
                                cursor: replacementMode ? 'pointer' : 'default'
                              }}
                              onClick={() => {
                                if (replacementMode && movingParticipant) {
                                  handleReplacePlayer(selectedGroupId!, member);
                                }
                              }}
                            />
                            <span className={replacementMode ? 'cursor-pointer' : ''}>
                              {member.name}
                            </span>
                          </div>
                          {!replacementMode && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleMoveClick(member, selectedGroupId!)}
                                className="text-sm hover:text-blue-600"
                              >
                                ↔
                              </button>
                              <button
                                onClick={() => handleDeletePlayer(selectedGroupId!, member)}
                                className="text-xl font-bold hover:text-red-600"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Modal de déplacement */}
            {showMoveModal && movingParticipant && (
              <>
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50" 
                  onClick={() => {
                    setShowMoveModal(false);
                    setMovingParticipant(null);
                    setReplacementMode(false);
                    setTargetGroupId(null);
                  }}
                />
                <div 
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white border-2 border-black p-6 z-20 rounded-lg"
                >
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-center">
                      Déplacer {movingParticipant.participant.name}
                    </h3>
                    {replacementMode ? (
                      <>
                        <p className="text-center text-gray-600">
                          Sélectionnez le joueur à remplacer
                        </p>
                        <div className="flex flex-col gap-2">
                          {groups
                            .find(g => g.id === targetGroupId)
                            ?.members?.map(player => (
                              <ThickBorderButton
                                key={player.id}
                                onClick={() => handleReplacePlayer(targetGroupId!, player)}
                                className="w-full flex items-center gap-2 justify-between"
                              >
                                <span>{player.name}</span>
                                <ThickBorderCircle 
                                  size={24} 
                                  style={{ backgroundColor: 'white', cursor: 'pointer' }}
                                />
                              </ThickBorderButton>
                            ))}
                        </div>
                        <ThickBorderButton
                          onClick={() => {
                            setReplacementMode(false);
                            setTargetGroupId(null);
                          }}
                          className="mt-2"
                        >
                          Retour aux groupes
                        </ThickBorderButton>
                      </>
                    ) : (
                      <>
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
                                <span>{group.name}</span>
                                <span className={group.members && group.members.length >= 3 ? "text-red-600" : ""}>
                                  {group.members && group.members.length >= 3 ? 
                                    " (Plein - Cliquez pour remplacer)" : 
                                    ` (${group.members?.length || 0}/3)`}
                                </span>
                              </ThickBorderButton>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="absolute bottom-8 left-8">
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <ThickBorderButton>
              Retour
            </ThickBorderButton>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GroupAdmin;
