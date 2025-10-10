/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // <-- ajout useNavigate
import ThickBorderButton from "../components/ui/ThickBorderButton";
import ThickBorderCard from "../components/ui/ThickBorderCard";
import ThickBorderCircle from "../components/ui/ThickBorderCircle";
import partyService from "../services/partyService";
import groupService from "../services/groupService";
import userService from "../services/userService";
import useToast from "../hooks/useToast";
import { io, Socket } from 'socket.io-client';
import GameStateService from "../services/gameState.service";

interface Participant {
  id: number;
  name: string;
}

interface PlayerGroup {
  id: number;
  name?: string;
  participants: number;
  members?: Participant[];
}

const Group: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partyCode, setPartyCode] = useState<string | null>(null);
  const [groups, setGroups] = useState<PlayerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingParty, setLoadingParty] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);
  const { showToast, Toast } = useToast();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
      console.log('✅ Connected to WebSocket');

      // Rejoindre la room de la party pour recevoir les mises à jour
      newSocket.emit('join-party-room', id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from WebSocket');
    });

    // ✅ ÉCOUTER les mises à jour des groupes
    newSocket.on('group-updated', (data: {
      partyId: number,
      groupId: number,
      group: PlayerGroup,
      action: 'user-joined' | 'user-left'
    }) => {
      console.log('📢 Group update received:', data);

      // Mettre à jour le groupe dans l'état local
      setGroups(currentGroups =>
        currentGroups.map(g =>
          g.id === data.groupId ? data.group : g
        )
      );

      // Optionnel : Toast de notification
      if (data.action === 'user-joined') {
        showToast(`Quelqu'un a rejoint ${data.group.name || `Groupe ${data.groupId}`}`);
      }
    });

    newSocket.on('groups-created', (data: {
      partyId: number,
      groups: PlayerGroup[]
    }) => {
      console.log('📢 New groups created:', data);

      // Ajouter les nouveaux groupes à la liste existante
      setGroups(currentGroups => {
        const existingIds = currentGroups.map(g => g.id);
        const newGroups = data.groups.filter(g => !existingIds.includes(g.id));

        if (newGroups.length > 0) {
          showToast(`🎉 ${newGroups.length} nouveau(x) groupe(s) créé(s) !`);
          return [...currentGroups, ...newGroups];
        }

        return currentGroups;
      });
    });

    newSocket.on('user-watching-party', (data: { userId: number, socketId: string }) => {
      console.log(`👀 User ${data.userId} is now watching the party`);
    });

    // Cleanup à la déconnexion
    return () => {
      newSocket.emit('leave-party-room', id);
      newSocket.disconnect();
    };
  }, [id, showToast]);


  useEffect(() => {
    const loadParty = async () => {
      if (!id) return;
      const partyId = parseInt(id, 10);
      if (isNaN(partyId)) return;
      try {
        setLoadingParty(true);
        const p = await partyService.getById(partyId);
        setPartyCode(p?.code ?? null);

        // Si on entre dans une nouvelle party (différente de celle en localStorage) :
        const prev = localStorage.getItem("partyId");
        if (prev !== String(partyId)) {
          // reset persisted game results and extra points
          try { localStorage.removeItem("gameResults"); } catch { }
          try { localStorage.removeItem("extraCompleted"); } catch { }
        }

        const now = Date.now();
        const end = p?.endTime ? new Date(p.endTime).getTime() : null;

        // Partie terminée
        if (end && end < now) {
          showToast("La partie est terminée.");
          return;
        }

        // Partie en cours : il y a une endTime future -> vérifier si l'utilisateur a déjà un groupe
        if (end && end > now) {
          try {
            const userGroup = await userService.getUserGroupInParty(partyId);
            if (userGroup) {
              navigate(`/dashboard`);
            } else {
              showToast("La partie est en cours, vous ne pouvez plus rejoindre un groupe. vous allez être redirigé vers l'accueil.");
              // Wait few seconds
              setTimeout(() => {
                navigate(`/home`);
              }, 3000);
            }
          } catch (err) {
            console.error("Erreur lors de la vérification du groupe utilisateur :", err);
            showToast("Impossible de vérifier votre inscription pour cette partie. Réessayez plus tard.");
          }
          return;
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de récupérer la partie.");
      } finally {
        setLoadingParty(false);
        localStorage.setItem("partyId", partyId.toString());
      }
    };
    loadParty();
  }, [id, navigate, showToast]);

  useEffect(() => {
    const loadGroups = async () => {
      if (!id) return;
      const partyId = parseInt(id, 10);
      if (isNaN(partyId)) return;
      try {
        setLoading(true);
        const svcGroups = await groupService.getByPartyId(partyId);
        const mapped = await Promise.all(
          svcGroups.map(async (g: any, idx: number) => {
            const membersRaw = g.members ?? (await userService.getUsersByGroupId(g.id));
            const members = (membersRaw ?? []).map((m: any) => ({ id: m.id, name: m.name ?? m.username }));
            return {
              id: g.id,
              name: g.name ?? `Groupe ${idx + 1}`,
              participants: members.length,
              members,
            } as PlayerGroup;
          })
        );
        setGroups(mapped);
        setError(null);

        try {
          const userGroup = await userService.getUserGroupInParty(partyId);
          if (userGroup && userGroup.id) {
            setCurrentGroupId(userGroup.id);
          } else {
            setCurrentGroupId(null);
            // fallback to localStorage as before only when server returns null
            try {
              const stored = localStorage.getItem("userId");
              const meId = stored ? parseInt(stored, 10) : NaN;
              if (!isNaN(meId)) {
                const found = mapped.find((mg) => mg.members?.some((mem) => mem.id === meId));
                if (found) setCurrentGroupId(found.id);
              }
            } catch {
              // ignore parsing/localStorage fail
            }
          }
        } catch (svcErr) {
          // if server check fails, fallback to localStorage to preserve some behavior
          console.warn("Vérification serveur du groupe utilisateur échouée, fallback local:", svcErr);
          try {
            const stored = localStorage.getItem("userId");
            const meId = stored ? parseInt(stored, 10) : NaN;
            if (!isNaN(meId)) {
              const found = mapped.find((mg) => mg.members?.some((mem) => mem.id === meId));
              if (found) setCurrentGroupId(found.id);
            }
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de récupérer les groupes.");
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, [id]);

  const handleJoin = async (groupId: number) => {
    if (currentGroupId !== null && currentGroupId !== groupId) return;
    if (currentGroupId === groupId) return;
    if (joiningGroupId) return;

    try {
      setJoiningGroupId(groupId);
      setCurrentGroupId(groupId);

      // Optimistic update (code existant...)
      const stored = localStorage.getItem("userId");
      const meId = stored ? parseInt(stored, 10) : NaN;
      const meName = localStorage.getItem("username") ?? "Vous";

      if (!isNaN(meId)) {
        setGroups((current) =>
          current.map((g) => {
            if (g.id !== groupId) return g;
            const exists = (g.members ?? []).some((m) => m.id === meId);
            if (exists) return g;
            const newMembers = [...(g.members ?? []), { id: meId, name: meName }];
            return { ...g, members: newMembers, participants: newMembers.length };
          })
        );
      }

      // Appel API existant
      await groupService.joinGroup(groupId);

      // ✅ NOUVEAU : Émettre l'événement WebSocket
      if (socket && id) {
        socket.emit('user-joined-group', {
          partyId: parseInt(id),
          groupId: groupId
        });
      }

      // Rafraîchissement des données existant...
      const membersRaw = await userService.getUsersByGroupId(groupId);
      const members = (membersRaw ?? []).map((m: any) => ({ id: m.id, name: m.name ?? m.username }));

      setGroups((current) =>
        current.map((g) => (g.id === groupId ? { ...g, members, participants: members.length } : g))
      );

      setError(null);

    } catch (err: any) {
      // Gestion d'erreur existante...
      console.error(err);

      // Revert optimistic update
      const stored = localStorage.getItem("userId");
      const meId = stored ? parseInt(stored, 10) : NaN;
      setCurrentGroupId(null);

      if (!isNaN(meId)) {
        setGroups((current) =>
          current.map((g) =>
            g.id === groupId
              ? { ...g, members: (g.members ?? []).filter((m) => m.id !== meId), participants: ((g.members ?? []).filter((m) => m.id !== meId)).length }
              : g
          )
        );
      }

      if (err?.response?.status === 400) {
        setError("Ce groupe est plein ou vous êtes déjà dans un groupe.");
      } else {
        setError("Impossible de rejoindre le groupe.");
      }
    } finally {
      setJoiningGroupId(null);
    }
  };

  return (
    // CHANGED: appliquer un fond magique et position relative pour overlays
    <div className="w-full min-h-screen p-6 flex flex-col items-center gap-8 bg-gradient-to-br from-stone-900 via-amber-900 to-stone-800 text-amber-100 relative overflow-hidden">

      {/* Fond d'étoiles magiques (overlay décoratif) */}
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
        {/* léger voile parchmént */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-900/10 to-transparent" />
      </div>

      {/* content (au-dessus de l'overlay) */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-4">

        {/* ✅ NOUVEAU : Indicateur de connexion WebSocket */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-amber-200">
            {isConnected ? 'Temps réel activé' : 'Temps réel déconnecté'}
          </span>
        </div>

        {/* CHANGED: style parchment pour le card montrant le code */}
        <ThickBorderCard className="bg-amber-50/5 backdrop-blur-sm border-amber-400 text-stone-900">
          {loadingParty ? "Chargement..." : partyCode ?? "—"}
        </ThickBorderCard>

        <div className="w-full text-center text-sm text-amber-200">Rejoignez un groupe (max 3 joueurs)</div>

        {error && <div className="text-sm text-red-300">{error}</div>}

        <div className="w-full mt-4">
          {loading ? (
            <div className="text-center text-sm">Chargement des groupes...</div>
          ) : groups.length === 0 ? (
            <div className="text-center text-sm text-amber-200/60">Aucun groupe n'a encore été créé.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((g) => (
                // CHANGED: carte de groupe style "magical"
                <div
                  key={g.id}
                  className={`rounded-lg p-4 flex flex-col gap-3 backdrop-blur-sm border-2 transition-colors ${currentGroupId === g.id ? 'bg-amber-200/10 border-amber-300' : 'bg-amber-50/5 border-amber-400'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-amber-100">{g.name}</div>
                    <div className="text-sm text-amber-200">{g.participants}/3</div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {g.members && g.members.length > 0 ? (
                      g.members.map((m, idx) => (
                        <div key={`${m.id ?? "noid"}-${g.id}-${idx}`} className="flex items-center gap-2">
                          <ThickBorderCircle size={24} style={{ backgroundColor: "white" }} title={m.name} />
                          <span className="text-sm text-amber-100">{m.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-amber-200">Aucun participant</div>
                    )}
                  </div>
                  <div className="mt-2 flex justify-end">
                    {/* N'afficher le bouton que si l'utilisateur n'est pas déjà dans un autre groupe,
                        ou si c'est le groupe courant (pour indiquer "Dans ce groupe"). */}
                    {(currentGroupId === null || currentGroupId === g.id) ? (
                      <ThickBorderButton
                        onClick={() => handleJoin(g.id)}
                        disabled={
                          (g.members?.length ?? 0) >= 3 ||
                          joiningGroupId === g.id ||
                          currentGroupId === g.id
                        }
                        className="bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-900 hover:brightness-105"
                      >
                        {joiningGroupId === g.id
                          ? "Rejoindre..."
                          : currentGroupId === g.id
                            ? "Votre groupe"
                            : (g.members?.length ?? 0) >= 3
                              ? "Plein"
                              : "Rejoindre"}
                      </ThickBorderButton>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Toast />
    </div>
  );
};

export default Group;
