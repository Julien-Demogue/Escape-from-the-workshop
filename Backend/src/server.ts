import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import { MessageService } from './services/message.service';
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
    console.log('🔌 User connected:', socket.id);

    socket.on('join-group', async (groupId: string) => {
      socket.join(groupId);
      try {
        const groupMessages = await messageService.getMessagesByGroupId(Number(groupId));
        console.log(groupMessages);
        socket.emit('message-history', groupMessages);

        socket.to(groupId).emit('user-joined', {
          message: `A user has joined the group`,
          socketId: socket.id
        });
      } catch (error) {
        console.error('❌ Error fetching messages:', error);

        // Send an error to the client
        socket.emit('error', {
          message: 'Unable to load message history',
          type: 'HISTORY_LOAD_ERROR'
        });
      }
    });

    socket.on('send-message', async (data) => {
      console.log('💬 Message received:', data);
      const userId = (socket as any).userId;
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
          sendDate: sendMessage.sendDate,
          socketId: socket.id
        });
      } catch (error) {
        console.error('❌ Error sending message:', error);

        // Send an error to the client
        socket.emit('error', {
          message: 'Unable to send message',
          type: 'MESSAGE_SEND_ERROR'
        });
      }

    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
    console.log(`🔌 Socket.IO configured and ready`);
    console.log(`📊 Prometheus metrics available on /metrics`);
    console.log(`📖 Swagger documentation available on /swagger`);
  });

  export { io };