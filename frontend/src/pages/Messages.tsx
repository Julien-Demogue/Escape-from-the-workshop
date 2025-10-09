import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import userService from '../services/userService';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  content: string;
  senderId: number;
  sendDate: string;
  socketId?: string;
}

interface User {
  id: number;
  username: string;
  hashedEmail: string;
  color: string;
}

const Messages: React.FC = () => {

  const navigate = useNavigate();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [groupUsers, setGroupUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [groupId, setGroupId] = useState<string>();

  useEffect(() => {
    const getGroupId = async () => {
      const response = await userService.getUserGroupInParty(Number(localStorage.getItem("partyId")));
      setGroupId(response?.id.toString());
    }
    const fetchGroupUsers = async () => {
      setLoading(true);
      try {
        const users = await userService.getUsersByGroupId(Number(groupId));
        setGroupUsers(users);
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
        setGroupUsers([]);
      } finally {
        setLoading(false);
      }
    };

    getGroupId().then(() =>
      fetchGroupUsers()
    );
  }, [groupId]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('❌ Aucun token trouvé, redirection vers login recommandée');
      // Optionnel: rediriger vers /login
      return;
    }

    const newSocket = io('http://localhost:3000', {
      auth: {
        token: token // ✅ Envoyer le token dans l'authentification
      },
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);

      newSocket.emit('join-group', groupId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('receive-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('message-history', (history: Message[]) => {
      setMessages(history);
    });

    newSocket.on('error', (error) => {
      console.error('❌ Erreur serveur:', error);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [groupId]);

  // Auto-scroll vers les derniers messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (socket && messageInput.trim() && isConnected) {
      const messageData = {
        groupId,
        content: messageInput,
        // ✅ senderId sera extrait du JWT côté serveur
      };

      socket.emit('send-message', messageData);
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm hover:cursor-pointer"
        >
          {/* ✅ SVG directement dans le JSX */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-600"
          >
            <path
              fill="currentColor"
              d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
            />
            <path
              fill="currentColor"
              d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
            />
          </svg>
          <span className="text-gray-700 font-medium">Retour</span>
        </button>
        <h1 className="text-3xl font-bold text-center mb-8">💬 Chat - Groupe {groupId}</h1>
        {/* Status de connexion */}
        <div className="mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>

          {/* ✅ Liste des utilisateurs avec couleurs */}
          <div className="text-sm">
            {loading ? (
              <span className="text-gray-500">Chargement des utilisateurs...</span>
            ) : (
              <div>
                <span className="text-gray-600">Membres du groupe ({groupUsers.length}): </span>
                {groupUsers.map((user, index) => (
                  <span key={user.id}>
                    <span
                      className="font-medium px-2 py-1 rounded-full text-white text-xs"
                      style={{ backgroundColor: groupUsers.find(u => u.id === user.id)?.color || '#888' }}
                    >
                      {groupUsers.find(u => u.id === user.id)?.username || 'Inconnu'}
                    </span>
                    {index < groupUsers.length - 1 && ' '}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">

          {/* ✅ Rectangle des messages avec couleurs utilisateurs */}
          <div className="h-96 overflow-y-auto border-b border-gray-200 p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <p>Aucun message dans ce groupe.</p>
                <p className="text-sm">Soyez le premier à écrire ! 💬</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const userColor = groupUsers.find(u => u.id === message.senderId)?.color || '#888';
                const userName = groupUsers.find(u => u.id === message.senderId)?.username || 'Utilisateur';

                return (
                  <div key={`${message.id}-${index}`} className="flex items-start gap-3">
                    {/* ✅ Avatar avec couleur utilisateur */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: userColor }}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </div>

                    {/* ✅ Contenu du message */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className="font-medium text-sm"
                          style={{ color: userColor }}
                        >
                          {userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.sendDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-gray-800">{message.content}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ✅ Input pour envoyer un message */}
          <div className="p-4 bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message... (Entrée pour envoyer)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isConnected}
              />
              <button
                onClick={sendMessage}
                disabled={!isConnected || !messageInput.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;