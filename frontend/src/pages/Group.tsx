/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ThickBorderButton from "../components/ui/ThickBorderButton";
import ThickBorderCard from "../components/ui/ThickBorderCard";
import ThickBorderCircle from "../components/ui/ThickBorderCircle";
import partyService from "../services/partyService";
import groupService from "../services/groupService";
import userService from "../services/userService";

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
  const { id } = useParams<{ id: string }>(); // attend l'id de la party
  const [partyCode, setPartyCode] = useState<string | null>(null);
  const [groups, setGroups] = useState<PlayerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingParty, setLoadingParty] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);

  useEffect(() => {
    const loadParty = async () => {
      if (!id) return;
      const partyId = parseInt(id, 10);
      if (isNaN(partyId)) return;
      try {
        setLoadingParty(true);
        const p = await partyService.getById(partyId);
        setPartyCode(p?.code ?? null);
      } catch (err) {
        console.error(err);
        setError("Impossible de récupérer la partie.");
      } finally {
        setLoadingParty(false);
      }
    };
    loadParty();
  }, [id]);

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

        // Remplacement: lire l'id utilisateur depuis localStorage au lieu d'appeler userService.getCurrentUser/getMe
        try {
          const stored = localStorage.getItem("userId");
          const meId = stored ? parseInt(stored, 10) : NaN;
          if (!isNaN(meId)) {
            const found = mapped.find((mg) => mg.members?.some((mem) => mem.id === meId));
            if (found) setCurrentGroupId(found.id);
          }
        } catch {
          // ignore si parsing/localStorage fail
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
    // Empêche de tenter de rejoindre un autre groupe si on est déjà dans un groupe
    // Empêche aussi de rejoindre plusieurs fois le même groupe
    if (currentGroupId !== null && currentGroupId !== groupId) return;
    if (currentGroupId === groupId) return; // <-- nouvelle garde: pas de re-join
    if (joiningGroupId) return;
    try {
      // Optimistic update : on marque immédiatement le groupe courant pour désactiver/masquer les autres boutons
      setJoiningGroupId(groupId);
      setCurrentGroupId(groupId);

      // Récupère l'id/nom utilisateur depuis localStorage pour ajout optimiste
      const stored = localStorage.getItem("userId");
      const meId = stored ? parseInt(stored, 10) : NaN;
      const meName = localStorage.getItem("username") ?? "Vous";

      // Ajout optimiste du membre dans le groupe pour mise à jour UI immédiate
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

      await groupService.joinGroup(groupId);
      // rafraîchir les membres de ce groupe
      const membersRaw = await userService.getUsersByGroupId(groupId);
      const members = (membersRaw ?? []).map((m: any) => ({ id: m.id, name: m.name ?? m.username }));
      setGroups((current) =>
        current.map((g) => (g.id === groupId ? { ...g, members, participants: members.length } : g))
      );
      setError(null);
    } catch (err: any) {
      console.error(err);
      // revert de l'optimistic update si échec
      const stored = localStorage.getItem("userId");
      const meId = stored ? parseInt(stored, 10) : NaN;
      setCurrentGroupId(null);
      if (!isNaN(meId)) {
        // retirer le membre ajouté optimistiquement
        setGroups((current) =>
          current.map((g) =>
            g.id === groupId ? { ...g, members: (g.members ?? []).filter((m) => m.id !== meId), participants: ((g.members ?? []).filter((m) => m.id !== meId)).length } : g
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
    <div className="w-full min-h-screen p-6 flex flex-col items-center gap-8">
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        <ThickBorderCard>{loadingParty ? "Chargement..." : partyCode ?? "—"}</ThickBorderCard>
        <div className="w-full text-center text-sm text-gray-600">Rejoignez un groupe (max 3 joueurs)</div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="w-full mt-4">
          {loading ? (
            <div className="text-center text-sm">Chargement des groupes...</div>
          ) : groups.length === 0 ? (
            <div className="text-center text-sm text-gray-500">Aucun groupe n'a encore été créé.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((g) => (
                <div key={g.id} className="border-2 border-black rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">{g.name}</div>
                    <div className="text-sm text-gray-600">{g.participants}/3</div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {g.members && g.members.length > 0 ? (
                      g.members.map((m, idx) => (
                        <div key={`${m.id ?? "noid"}-${g.id}-${idx}`} className="flex items-center gap-2">
                          <ThickBorderCircle size={24} style={{ backgroundColor: "white" }} title={m.name} />
                          <span className="text-sm">{m.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">Aucun participant</div>
                    )}
                  </div>
                  <div className="mt-2 flex justify-end">
                    {/* Si on est déjà dans un autre groupe, on retire complètement les boutons 'Rejoindre' pour les autres groupes */}
                    {currentGroupId !== null && currentGroupId !== g.id ? null : (
                      <ThickBorderButton
                        onClick={() => handleJoin(g.id)}
                        disabled={
                          (g.members?.length ?? 0) >= 3 ||
                          joiningGroupId === g.id ||
                          currentGroupId === g.id // empêcher de re-joindre le même groupe
                        }
                      >
                        {joiningGroupId === g.id
                          ? "Rejoindre..."
                          : currentGroupId === g.id
                            ? "Dans ce groupe"
                            : (g.members?.length ?? 0) >= 3
                              ? "Plein"
                              : "Rejoindre"}
                      </ThickBorderButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Group;
