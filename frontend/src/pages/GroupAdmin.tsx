/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import partyService from "../services/partyService";
import groupService from "../services/groupService";
import userService from "../services/userService"; // <-- ajout
import ThickBorderCard from "../components/ui/ThickBorderCard";
import GameStateService from "../services/gameState.service";
import ThickBorderButton from "../components/ui/ThickBorderButton";
import { io, Socket } from 'socket.io-client';
import ThickBorderCircle from "../components/ui/ThickBorderCircle";
import ThickBorderError from "../components/ui/ThickBorderError";
import ThickBorderInput from "../components/ui/ThickBorderInput";
import useToast from "../hooks/useToast";
// known games to reset when joining/creating a new party
const KNOWN_GAME_KEYS = ['heraldry-quiz', 'puzzle', 'memory-loire', 'courrier-loire', 'brissac-enigma', 'chambord-enigma'];

interface Participant {
  id: number;
  name: string;
}

// Rename local Group to avoid collision with service type
interface AdminGroup {
  id: number;
  participants: number;
  name?: string;
  members?: Participant[];
}

interface MovingParticipant {
  participant: Participant;
  fromGroupId: number;
}

// --- Ajout : caches de promesses pour éviter les double-requests (StrictMode dev double-mount) ---
const partyFetchCache = new Map<number, Promise<any>>();
const groupsFetchCache = new Map<number, Promise<any>>();
// --- fin ajout ---

const GroupAdmin: React.FC = () => {
  const { showToast, Toast } = useToast();
  const [numberOfGroups, setNumberOfGroups] = useState("1");
  const [participantsPerGroup, setParticipantsPerGroup] = useState("1");
  // use AdminGroup type
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [movingParticipant, setMovingParticipant] = useState<MovingParticipant | null>(null);
  const [replacementMode, setReplacementMode] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [partyCode, setPartyCode] = useState<string | null>(null);
  const [loadingParty, setLoadingParty] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [creatingGroups, setCreatingGroups] = useState(false);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<number[]>([]);

  // Nouveaux états pour gérer l'action "rejoindre"
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);

  // Nouvel état pour démarrage de la partie
  const [startingParty, setStartingParty] = useState(false);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Créer la connexion WebSocket
    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Admin connected to WebSocket');

      // Rejoindre la room de la party pour recevoir les mises à jour
      newSocket.emit('join-party-room', id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setConnectedUsers([]);
      console.log('❌ Admin disconnected from WebSocket');
    });

    // ✅ ÉCOUTER les mises à jour des groupes
    newSocket.on('group-updated', (data: {
      partyId: number,
      groupId: number,
      group: any,
      action: 'user-joined' | 'user-left'
    }) => {
      console.log('📢 Admin received group update:', data);

      // Mettre à jour le groupe dans l'état local
      setGroups(currentGroups =>
        currentGroups.map(g =>
          g.id === data.groupId ? {
            ...g,
            members: data.group.members || [],
            participants: data.group.participants || 0,
            name: data.group.name || g.name
          } : g
        )
      );

      // Notification pour l'admin
      if (data.action === 'user-joined') {
        showToast(`✅ ${data.group.members?.slice(-1)[0]?.name || 'Quelqu\'un'} a rejoint ${data.group.name || `Groupe ${data.groupId}`}`);
      } else {
        showToast(`👋 Quelqu'un a quitté ${data.group.name || `Groupe ${data.groupId}`}`);
      }
    });

    // ✅ ÉCOUTER qui regarde la party
    newSocket.on('user-watching-party', (data: { userId: number, socketId: string }) => {
      console.log(`👀 User ${data.userId} is watching the party`);
      setConnectedUsers(prev => [...new Set([...prev, data.userId])]);
    });

    // Cleanup à la déconnexion
    return () => {
      newSocket.emit('leave-party-room', id);
      newSocket.disconnect();
    };
  }, [id, showToast]);

  useEffect(() => {
    const fetchParty = async () => {
      if (!id) return;
      const partyId = parseInt(id, 10);
      if (isNaN(partyId)) return;

      try {
        setLoadingParty(true);

        // Si une promesse pour cette partyId est déjà en cours, on la réutilise
        let promise = partyFetchCache.get(partyId);
        if (!promise) {
          promise = partyService.getById(partyId);
          partyFetchCache.set(partyId, promise);
          // on supprime la promesse du cache une fois terminée (success ou erreur)
          promise.finally(() => partyFetchCache.delete(partyId));
        }

        const party = await promise;
        setPartyCode(party?.code ?? null);
      } catch (err) {
        console.log(err);
        setErrorMessage("Impossible de récupérer le code de la partie.");
      } finally {
        setLoadingParty(false);
        // si nouvelle party, reset persistances et états de jeu
        const prev = localStorage.getItem("partyId");
        if (prev !== String(partyId)) {
          try { localStorage.removeItem("gameResults"); } catch { }
          try { localStorage.removeItem("extraCompleted"); } catch { }
          KNOWN_GAME_KEYS.forEach(k => {
            try { GameStateService.setState(k, 'unvisited'); } catch { }
          });
        }
        localStorage.setItem("partyId", partyId.toString());
      }
    };
    fetchParty();
  }, [id]);

  // Charger les groupes depuis l'API quand l'id change
  useEffect(() => {
    const loadGroups = async () => {
      if (!id) return;
      const partyId = parseInt(id, 10);
      if (isNaN(partyId)) return;

      try {
        setLoadingGroups(true);

        // Réutiliser la promesse si une requête identique est déjà en cours
        let promise = groupsFetchCache.get(partyId);
        if (!promise) {
          promise = groupService.getByPartyId(partyId);
          groupsFetchCache.set(partyId, promise);
          promise.finally(() => groupsFetchCache.delete(partyId));
        }

        const svcGroups = await promise;

        // Pour chaque groupe, récupérer les membres via la réponse si fournie,
        // sinon via userService.getUsersByGroupId
        const mappedPromises = svcGroups.map(async (g: any, idx: number) => {
          const membersRaw = g.members ?? await userService.getUsersByGroupId(g.id);
          // normalize members so UI can always read .name (fallback to username)
          const members = (membersRaw ?? []).map((m: any) => ({ id: m.id, name: m.name ?? m.username }));
          return {
            id: g.id,
            participants: members.length,
            name: g.name ?? `Groupe ${idx + 1}`,
            members
          } as AdminGroup;
        });

        const mapped = await Promise.all(mappedPromises);
        setGroups(mapped);

        try {
          const userGroup = await userService.getUserGroupInParty(partyId);
          if (userGroup && userGroup.id) {
            setCurrentGroupId(userGroup.id);
          } else {
            setCurrentGroupId(null);
          }
        } catch (innerErr) {
          // if server check fails, keep existing behaviour (no crash) — optionally fallback to localStorage elsewhere
          console.warn("Impossible de vérifier le groupe de l'utilisateur côté serveur:", innerErr);
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Impossible de récupérer les groupes depuis le serveur.");
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, [id]);

  // Nouveau : supprimer tout le groupe (via service)
  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm("Supprimer ce groupe ? Cette action est irréversible.")) return;
    try {
      await groupService.deleteGroup(groupId);
      setGroups(currentGroups => currentGroups.filter(g => g.id !== groupId));
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage("Impossible de supprimer le groupe via le serveur.");
    }
  };

  // Nouveau : renommer le groupe (prompt simple) -> envoi au service
  const handleRenameGroup = async (groupId: number) => {
    const current = groups.find(g => g.id === groupId);
    if (!current) return;
    const newName = prompt("Nouveau nom du groupe :", current.name ?? "");
    if (newName === null) return;
    try {
      const updated = await groupService.updateGroupName(groupId, newName);
      setGroups(currentGroups => currentGroups.map(g => g.id === groupId ? { ...g, name: updated?.name ?? newName } : g));
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage("Impossible de renommer le groupe via le serveur.");
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    // Prevent multiple simultaneous joins
    if (joiningGroupId) return;

    // Prevent joining the same group twice locally
    if (currentGroupId === groupId) {
      setErrorMessage("Vous avez déjà rejoint ce groupe.");
      return;
    }

    // Prevent joining another group if we already joined one locally
    if (currentGroupId && currentGroupId !== groupId) {
      setErrorMessage("Vous êtes déjà dans un autre groupe.");
      return;
    }

    try {
      setJoiningGroupId(groupId);
      await groupService.joinGroup(groupId);

      // ✅ NOUVEAU : Émettre l'événement WebSocket (même code que dans Group.tsx)
      if (socket && id) {
        socket.emit('user-joined-group', {
          partyId: parseInt(id),
          groupId: groupId
        });
      }

      // récupérer les membres mis à jour pour ce groupe
      const membersRaw = await userService.getUsersByGroupId(groupId);
      // normalize and dedupe members so UI can't get duplicates
      const members = (membersRaw ?? []).map((m: any) => ({ id: m.id, name: m.name ?? m.username }));
      const uniqueMembers: Participant[] = [];
      for (const m of members) {
        if (!uniqueMembers.find(u => u.id === m.id)) uniqueMembers.push(m);
      }
      setGroups(currentGroups => currentGroups.map(g =>
        g.id === groupId
          ? {
            ...g,
            members: uniqueMembers,
            participants: uniqueMembers.length
          }
          : g
      ));
      // marquer localement que nous sommes dans ce groupe pour bloquer d'autres joins côté UI
      setCurrentGroupId(groupId);
      setErrorMessage(null);
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 400) {
        setErrorMessage("Ce groupe est plein ou vous êtes déjà dans un groupe.");
      } else {
        setErrorMessage("Impossible de rejoindre le groupe via le serveur.");
      }
    } finally {
      setJoiningGroupId(null);
    }
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

  // Ajout : handler pour démarrer la partie (endDate = now + 1h)
  const handleStartParty = async () => {
    // NEW: prevent starting when there are no groups
    if (groups.length === 0) {
      showToast("Impossible de démarrer : aucun groupe n'a été créé.");
      return;
    }

    if (!currentGroupId) {
      showToast("Vous devez rejoindre un groupe pour démarrer la partie.");
      return;
    }

    if (!id) {
      setErrorMessage("Aucun identifiant de partie fourni.");
      return;
    }
    const partyId = parseInt(id, 10);
    if (isNaN(partyId)) {
      setErrorMessage("Identifiant de partie invalide.");
      return;
    }

    try {
      setStartingParty(true);
      const endDate = new Date();
      endDate.setHours(endDate.getHours() + 1);
      // timestamp in milliseconds
      const endDateTimestamp = endDate.getTime();
      await partyService.startParty(partyId, endDateTimestamp);
      // rediriger vers le dashboard après démarrage
      navigate("/dashboard");
    } catch (err) {
      console.error("Erreur lors du démarrage de la partie :", err);
      setErrorMessage("Impossible de démarrer la quête. Réessayez.");
    } finally {
      setStartingParty(false);
    }
  };

  return (
    // CHANGED: fond magical et overlay étoiles
    <div className="relative w-full min-h-screen p-8 overflow-y-auto bg-gradient-to-br from-stone-900 via-amber-900 to-stone-800 text-amber-100">
      {/* étoiles magiques */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-yellow-200 opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-900/10 to-transparent" />
      </div>

      {/* ✅ NOUVEAU : Status WebSocket pour l'admin */}
      <div className="fixed top-8 left-8 z-20">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50/10 backdrop-blur-sm rounded-lg border border-amber-400/50">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-xs text-amber-200">
              {isConnected ? 'Admin connecté' : 'Admin déconnecté'}
            </span>
          </div>

          {isConnected && connectedUsers.length > 0 && (
            <div className="px-3 py-1 bg-blue-50/10 backdrop-blur-sm rounded-lg border border-blue-400/50">
              <span className="text-xs text-blue-200">
                👥 {connectedUsers.length} utilisateur{connectedUsers.length > 1 ? 's' : ''} en ligne
              </span>
            </div>
          )}
        </div>
      </div>

      {/* fixed top-right controls (CHANGED: parchment style) */}
      <div className="fixed top-8 right-8 flex flex-col items-center gap-4 z-20">
        <ThickBorderCard className="bg-amber-50/5 backdrop-blur-sm border-amber-400 text-stone-900">
          {loadingParty ? "Chargement..." : (partyCode ?? "—")}
        </ThickBorderCard>

        <ThickBorderButton
          onClick={handleStartParty}
          disabled={startingParty || groups.length === 0 || !currentGroupId}
          className={`flex items-center justify-center px-4 py-2 ${startingParty ? 'opacity-80' : 'bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-900 hover:brightness-105'}`}
          title={
            startingParty ? undefined
              : (!currentGroupId ? "Vous devez rejoindre un groupe pour démarrer la partie" : (groups.length === 0 ? "Créer au moins un groupe avant de démarrer" : undefined))
          }
        >
          {startingParty ? "Démarrage..." : "Démarrer"}
        </ThickBorderButton>

        {groups.length === 0 && (
          <div role="status" aria-live="polite" className="text-sm text-red-300 mt-1 text-center max-w-xs">
            Créez au moins un groupe avant de démarrer la partie.
          </div>
        )}

        {!currentGroupId && groups.length > 0 && (
          <div role="status" aria-live="polite" className="text-sm text-red-300 mt-1 text-center max-w-xs">
            Rejoignez un groupe avant de démarrer la partie.
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center h-full gap-8 max-w-md mx-auto relative z-10">
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

          {/* <div className="flex flex-col gap-2">
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
          </div> */}

          {/* <ThickBorderCheckbox
            label="Je fais partie des joueurs"
            checked={isPlayer}
            onChange={(e) => setIsPlayer(e.target.checked)}
          /> */}

          <ThickBorderButton
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-900 hover:brightness-105"
            onClick={async () => {
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

              // Utiliser le service de création de groupes côté serveur
              if (!id) {
                setErrorMessage("Aucun identifiant de partie fourni.");
                return;
              }
              const partyId = parseInt(id, 10);
              if (isNaN(partyId)) {
                setErrorMessage("Identifiant de partie invalide.");
                return;
              }

              try {
                setCreatingGroups(true);

                // ✅ Stocker les groupes existants avant création
                const existingGroupIds = groups.map(g => g.id);

                // Créer les groupes côté serveur
                await groupService.createGroups(partyId, numGroups);

                // Recharger les groupes et identifier les nouveaux
                const svcGroups = await groupService.getByPartyId(partyId);
                const newGroups = svcGroups.filter((g: any) => !existingGroupIds.includes(g.id));
                const newGroupIds = newGroups.map((g: any) => g.id);

                // Mettre à jour l'état local
                setGroups(prev => svcGroups.map((g: any, idx: number) => {
                  const existing = prev.find(pg => pg.id === g.id);
                  const membersRaw = (g as any).members ?? existing?.members ?? [];
                  const members = (membersRaw ?? []).map((m: any) => ({ id: m.id, name: m.name ?? m.username }));
                  return {
                    id: g.id,
                    participants: members.length ?? numParticipants,
                    name: g.name ?? `Groupe ${idx + 1}`,
                    members
                  } as AdminGroup;
                }));

                // ✅ NOUVEAU : Émettre l'événement WebSocket pour diffuser la création
                if (socket && newGroupIds.length > 0) {
                  socket.emit('groups-created', {
                    partyId: partyId,
                    groupIds: newGroupIds
                  });
                  console.log('📤 Événement groups-created émis pour:', newGroupIds);
                }

                setSelectedGroupId(null);
                setErrorMessage(null);
                showToast(`✅ ${newGroupIds.length} nouveau(x) groupe(s) créé(s) !`);

              } catch (err) {
                console.error(err);
                setErrorMessage("Impossible de créer les groupes via le serveur.");
              } finally {
                setCreatingGroups(false);
              }
            }}
            disabled={creatingGroups}
          >
            {creatingGroups ? "Création..." : "Créer les groupes"}
          </ThickBorderButton>
        </div>

        {/* Affichage des groupes (CHANGED: cartes parchment) */}
        {groups.length > 0 && (
          <div className="w-full mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`rounded-lg p-4 flex flex-col gap-3 transition-all duration-300 ${selectedGroupId === group.id
                    ? 'bg-amber-200/10 border-amber-300 shadow-amber-300/20 shadow-lg'
                    : 'bg-amber-50/5 border-amber-400'
                    }`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold text-amber-100">{group.name}</div>
                      {/* ✅ Indicateur de mise à jour temps réel */}
                      {isConnected && (
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Temps réel"></div>
                      )}
                    </div>
                    <div className="text-sm text-amber-200">{group.participants}/3</div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center min-h-[60px]">
                    {group.members && group.members.length > 0 ? (
                      group.members.map((member, mIdx) => (
                        <div key={`${member.id ?? 'noid'}-${group.id}-${mIdx}`} className="flex items-center gap-2 animate-fadeIn">
                          <ThickBorderCircle size={24} style={{ backgroundColor: 'white', cursor: 'default' }} title={member.name} />
                          <span className="text-sm text-amber-100">{member.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-amber-200">Aucun participant</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Détails du groupe */}
            {selectedGroupId && (
              <>
                <div
                  // overlay juste en-dessous du panneau (au-dessus du header z-20)
                  className="fixed inset-0 z-40"
                  onClick={() => {
                    setSelectedGroupId(null);
                    setReplacementMode(false);
                    setTargetGroupId(null);
                  }}
                />
                <div
                  // panneau déplacé à gauche (CHANGED: left-0 au lieu de right-0)
                  className="fixed left-0 top-0 h-full w-80 bg-white border-2 border-black p-6 z-50 overflow-y-auto text-stone-900"
                  style={{
                    // CHANGED: arrondir côté droit pour un panneau collé à gauche
                    borderTopRightRadius: '18px',
                    borderBottomRightRadius: '18px',
                    borderLeft: 'none'
                  }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold">
                          {groups.find(g => g.id === selectedGroupId)?.name}
                        </h3>
                        <button
                          onClick={() => handleRenameGroup(selectedGroupId)}
                          className="text-sm px-2 py-1 border rounded hover:bg-gray-100 text-stone-900"
                          title="Renommer le groupe"
                        >
                          ✎
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Show join controls only when the user hasn't joined any group yet */}
                        {!currentGroupId ? (
                          <button
                            onClick={() => handleJoinGroup(selectedGroupId)}
                            className="px-3 py-1 border rounded bg-white hover:bg-gray-50 text-stone-900"
                            disabled={
                              // disable if group full OR join in progress on this group
                              (groups.find(g => g.id === selectedGroupId)?.members?.length ?? 0) >= 3 ||
                              joiningGroupId === selectedGroupId
                            }
                          >
                            {joiningGroupId === selectedGroupId ? "Rejoindre..." : "Rejoindre"}
                          </button>
                        ) : currentGroupId === selectedGroupId ? (
                          <div className="px-3 py-1 border rounded bg-green-50 text-sm text-stone-900">Vous avez rejoint ce groupe</div>
                        ) : (
                          <div className="px-3 py-1 border rounded bg-gray-50 text-sm text-stone-900">Déjà dans un autre groupe</div>
                        )}
                        <button
                          onClick={() => handleDeleteGroup(selectedGroupId)}
                          className="text-xl font-bold hover:text-red-600"
                          title="Supprimer le groupe"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      {(groups.find(g => g.id === selectedGroupId)?.members?.length ?? 0)}/3 participants
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                      {groups.find(g => g.id === selectedGroupId)?.members?.map((member, mIdx) => (
                        <div key={`${member.id ?? 'noid'}-${selectedGroupId}-${mIdx}`} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <ThickBorderCircle
                              size={20}
                              style={{ backgroundColor: 'white', cursor: 'default' }}
                            />
                            <span className="text-stone-900">{member.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Removed the per-member "Déplacer" button from the right-hand panel */}
                          </div>
                        </div>
                      ))}
                      {(groups.find(g => g.id === selectedGroupId)?.members?.length ?? 0) === 0 && (
                        <div className="text-sm text-gray-500">
                          Aucun participant dans ce groupe.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Modal de déplacement */}
            {showMoveModal && movingParticipant && (
              <>
                <div
                  // overlay du modal au-dessus de tout sauf le panneau (doit être au-dessus aussi si modal ouvert)
                  className="fixed inset-0 bg-black bg-opacity-50 z-55"
                  onClick={() => {
                    setShowMoveModal(false);
                    setMovingParticipant(null);
                    setReplacementMode(false);
                    setTargetGroupId(null);
                  }}
                />
                <div
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white border-2 border-black p-6 z-60 rounded-lg"
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
                            ?.members?.map((player, pIdx) => (
                              <ThickBorderButton
                                key={`${player.id ?? 'noid'}-${targetGroupId}-${pIdx}`}
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
      </div>

      {/* Toast pour messages courts */}
      <Toast />
    </div>
  );
};

export default GroupAdmin;
