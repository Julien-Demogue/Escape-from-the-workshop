import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: number;
  content: string;
  senderId: number;
  sendDate: string;
  socketId: string;
}

const WebSocketTest: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [groupId, setGroupId] = useState('1');
  const [senderId, setSenderId] = useState('1');
  const [isInGroup, setIsInGroup] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fonction pour ajouter des logs
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    // Connexion au serveur WebSocket
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 5000, // ✅ Timeout après 5 secondes
      reconnection: true, // ✅ Reconnexion automatique
      reconnectionAttempts: 5, // ✅ Max 5 tentatives
      reconnectionDelay: 1000 // ✅ Délai entre tentatives
    });

    setSocket(newSocket);

    // ✅ Événements de connexion corrigés
    newSocket.on('connect', () => {
      setIsConnected(true);
      addLog(`✅ Connecté au serveur (ID: ${newSocket.id})`);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      addLog(`❌ Déconnecté du serveur: ${reason}`);
    });

    newSocket.on('connect_error', (error) => {
      addLog(`🔥 Erreur de connexion: ${error.message || error.toString()}`);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      addLog(`🔄 Reconnecté après ${attemptNumber} tentatives`);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      addLog(`🔄 Tentative de reconnexion ${attemptNumber}...`);
    });

    newSocket.on('reconnect_failed', () => {
      addLog(`❌ Échec de reconnexion après plusieurs tentatives`);
    });

    // Événements de messages
    newSocket.on('receive-message', (message: Message) => {
      addLog(`📨 Message reçu: ${JSON.stringify(message)}`);
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('message-history', (history: Message[]) => {
      addLog(`📚 Historique reçu: ${history.length} messages`);
      setMessages(history);
    });

    // Événements de groupe
    newSocket.on('user-joined', (data) => {
      addLog(`👤 Utilisateur rejoint: ${data.socketId}`);
    });

    newSocket.on('user-left', (data) => {
      addLog(`👋 Utilisateur parti: ${data.socketId}`);
    });

    newSocket.on('error', (error) => {
      addLog(`❌ Erreur serveur: ${error.message || error}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Auto-scroll vers les derniers messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const joinGroup = () => {
    if (socket && groupId) {
      socket.emit('join-group', groupId);
      setIsInGroup(true);
      addLog(`🚪 Rejoindre le groupe: ${groupId}`);
    }
  };

  const leaveGroup = () => {
    if (socket && groupId) {
      socket.emit('leave-group', groupId);
      setIsInGroup(false);
      addLog(`🚪 Quitter le groupe: ${groupId}`);
      setMessages([]);
    }
  };

  const sendMessage = () => {
    if (socket && messageInput.trim() && groupId && senderId) {
      const messageData = {
        groupId,
        content: messageInput,
        senderId: Number(senderId)
      };

      socket.emit('send-message', messageData);
      addLog(`📤 Message envoyé: ${JSON.stringify(messageData)}`);
      setMessageInput('');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">🧪 Test WebSocket</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Panel de contrôle */}
          <div className="space-y-6">

            {/* Status de connexion */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">📡 Connexion</h2>
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
                {isConnected && socket && (
                  <span className="text-gray-600 text-sm">ID: {socket.id}</span>
                )}
              </div>
            </div>

            {/* Configuration du groupe */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">👥 Groupe</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ID du Groupe</label>
                  <input
                    type="text"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={isInGroup}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sender ID</label>
                  <input
                    type="number"
                    value={senderId}
                    onChange={(e) => setSenderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={joinGroup}
                    disabled={!isConnected || isInGroup || !groupId}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    Rejoindre
                  </button>
                  <button
                    onClick={leaveGroup}
                    disabled={!isConnected || !isInGroup}
                    className="flex-1 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300"
                  >
                    Quitter
                  </button>
                </div>
                <div className={`text-sm font-medium ${isInGroup ? 'text-green-600' : 'text-gray-400'}`}>
                  {isInGroup ? `✅ Dans le groupe: ${groupId}` : '⭕ Pas dans un groupe'}
                </div>
              </div>
            </div>

            {/* Envoi de messages */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">💬 Envoyer un Message</h2>
              <div className="space-y-4">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                />
                <button
                  onClick={sendMessage}
                  disabled={!isConnected || !isInGroup || !messageInput.trim()}
                  className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300"
                >
                  Envoyer
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">🛠️ Actions</h2>
              <div className="flex gap-2">
                <button
                  onClick={clearMessages}
                  className="flex-1 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                >
                  Clear Messages
                </button>
                <button
                  onClick={clearLogs}
                  className="flex-1 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                >
                  Clear Logs
                </button>
              </div>
            </div>
          </div>

          {/* Panel d'affichage */}
          <div className="space-y-6">

            {/* Messages */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">📨 Messages ({messages.length})</h2>
              </div>
              <div className="h-64 overflow-y-auto border border-gray-200 rounded-md p-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-gray-500 text-center">Aucun message</div>
                ) : (
                  messages.map((message) => (
                    <div key={`${message.id}`} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">Sender ID: {message.senderId}</div>
                          <div className="text-gray-700">{message.content}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <div>ID: {message.id}</div>
                          <div>{new Date(message.sendDate).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Logs */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">📋 Logs ({logs.length})</h2>
              </div>
              <div className="h-64 overflow-y-auto border border-gray-200 rounded-md p-4 font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-gray-500">Aucun log</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-gray-800 mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketTest;