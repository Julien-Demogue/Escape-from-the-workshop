import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import { MessageService } from './services/message.service';
import { GroupService } from './services/group.service';
import { UserService } from './services/user.service';
import { Message } from './generated/prisma';
import { metricsMiddleware, metricsHandler } from './metrics';

import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: number;
  hashedEmail: string;
  iat?: number;
  exp?: number;
}

const app = express();
const PORT = process.env.PORT || 3000;
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:5173';

// Create HTTP server
const httpServer = createServer(app);

// Socket.IO config with CORS
const io = new Server(httpServer, {
  cors: {
    origin: FRONT_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: FRONT_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use metrics middleware early so it captures all requests
app.use(metricsMiddleware);

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(routes);

app.get('/metrics', metricsHandler);

const messageService = new MessageService();

function extractUserFromToken(token: string): JwtPayload | null {
  try {
    const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const payload = jwt.verify(cleanToken, secret) as JwtPayload;
    return payload;

  } catch (err) {
    console.error('Invalid token:', err);
    return null;
  }
}

io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

  if (!token) {
    return next(new Error('Token manquant'));
  }

  const userInfo = extractUserFromToken(token);
  if (!userInfo) {
    return next(new Error('Token invalide'));
  }

  // ✅ Stocker les infos utilisateur dans le socket
  (socket as any).userId = userInfo.id;
  (socket as any).userEmail = userInfo.hashedEmail;
  next();
});

io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  console.log(`🔌 User ${userId} connected:`, socket.id);

  // ✅ Handlers pour les groupes/party rooms
  socket.on('join-party-room', async (partyId: string) => {
    const roomName = `party-${partyId}`;
    socket.join(roomName);
    console.log(`📡 User ${userId} joined party room: ${roomName}`);

    socket.to(roomName).emit('user-watching-party', {
      userId: userId,
      socketId: socket.id
    });
  });

  socket.on('leave-party-room', (partyId: string) => {
    const roomName = `party-${partyId}`;
    socket.leave(roomName);
    console.log(`📡 User ${userId} left party room: ${roomName}`);
  });

  // ✅ Handlers pour les messages (existants)
  socket.on('join-group', async (groupId: string) => {
    socket.join(groupId);
    try {
      const groupMessages = await messageService.getMessagesByGroupId(Number(groupId));

      const formattedMessages = groupMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        sendDate: msg.sendDate instanceof Date ? msg.sendDate.toISOString() : msg.sendDate,
        socketId: 'db-message'
      }));

      socket.emit('message-history', formattedMessages);

      socket.to(groupId).emit('user-joined', {
        message: `User ${userId} has joined the group`,
        socketId: socket.id
      });
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      socket.emit('error', {
        message: 'Unable to load message history',
        type: 'HISTORY_LOAD_ERROR'
      });
    }
  });

  socket.on('send-message', async (data) => {
    console.log('💬 Message received from user', userId, ':', data);

    try {
      const sendMessage: Message = await messageService.sendMessage({
        groupId: Number(data.groupId),
        content: data.content,
        senderId: userId,
        sendDate: new Date()
      });

      io.to(data.groupId).emit('receive-message', {
        id: sendMessage.id,
        content: sendMessage.content,
        senderId: sendMessage.senderId,
        sendDate: sendMessage.sendDate instanceof Date ? sendMessage.sendDate.toISOString() : sendMessage.sendDate,
        socketId: socket.id
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('error', {
        message: 'Unable to send message',
        type: 'MESSAGE_SEND_ERROR'
      });
    }
  });

  // ✅ Handlers pour les mises à jour des groupes
  socket.on('user-joined-group', async (data: { partyId: number, groupId: number }) => {
    const roomName = `party-${data.partyId}`;

    try {
      const updatedGroup = await getUpdatedGroupInfo(data.groupId);

      io.to(roomName).emit('group-updated', {
        partyId: data.partyId,
        groupId: data.groupId,
        group: updatedGroup,
        action: 'user-joined'
      });

      console.log(`📢 Group ${data.groupId} updated broadcasted to party ${data.partyId}`);
    } catch (error) {
      console.error('❌ Error broadcasting group update:', error);
    }
  });

  socket.on('user-left-group', async (data: { partyId: number, groupId: number }) => {
    const roomName = `party-${data.partyId}`;

    try {
      const updatedGroup = await getUpdatedGroupInfo(data.groupId);

      io.to(roomName).emit('group-updated', {
        partyId: data.partyId,
        groupId: data.groupId,
        group: updatedGroup,
        action: 'user-left'
      });
    } catch (error) {
      console.error('❌ Error broadcasting group update:', error);
    }
  });

  socket.on('groups-created', async (data: { partyId: number, groupIds: number[] }) => {
    const roomName = `party-${data.partyId}`;

    try {
      // Récupérer les informations de tous les nouveaux groupes
      const updatedGroups = await Promise.all(
        data.groupIds.map(groupId => getUpdatedGroupInfo(groupId))
      );

      // Diffuser à tous les utilisateurs de la party
      io.to(roomName).emit('groups-created', {
        partyId: data.partyId,
        groups: updatedGroups
      });

      console.log(`📢 ${data.groupIds.length} nouveaux groupes créés et diffusés pour la party ${data.partyId}`);

    } catch (error) {
      console.error('❌ Error broadcasting group creation:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User ${userId} disconnected:`, socket.id);
  });
});

// ✅ Fonction utilitaire pour récupérer les infos d'un groupe
async function getUpdatedGroupInfo(groupId: number) {
  // Adaptez selon vos services existants
  const groupService = new GroupService();
  const userService = new UserService();

  const group = await groupService.getById(groupId);
  const members = await userService.getUsersByGroupId(groupId);

  return {
    id: group?.id,
    name: group?.name,
    participants: members.length,
    members: members.map((m: any) => ({
      id: m.id,
      name: m.name ?? m.username
    }))
  };
}

httpServer.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`🔌 Socket.IO configured and ready`);
  console.log(`📊 Prometheus metrics available on /metrics`);
  console.log(`📖 Swagger documentation available on /swagger`);
});

export { io };