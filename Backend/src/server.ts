import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import client from 'prom-client';
import { MessageService } from './services/message.service';
import { Message } from './generated/prisma';

const app = express();
const PORT = process.env.PORT || 3000;

// Créer le serveur HTTP pour Socket.IO
const httpServer = createServer(app);

// Configuration Socket.IO avec CORS
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // URL de votre frontend
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CORS pour Express (ajouté pour éviter les problèmes de CORS)
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(routes);

const messageService = new MessageService();

io.on('connection', (socket) => {
  console.log('🔌 Utilisateur connecté:', socket.id);

  socket.on('join-group', async (groupId: string) => {
    socket.join(groupId);
    try {
      const groupMessages = await messageService.getMessagesFromGroup(Number(groupId));
      console.log(groupMessages)
      socket.emit('message-history', groupMessages);

      socket.to(groupId).emit('user-joined', {
        message: `Un utilisateur a rejoint le groupe`,
        socketId: socket.id
      });
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des messages:', error);

      // Envoyer une erreur au client
      socket.emit('error', {
        message: 'Impossible de récupérer l\'historique des messages',
        type: 'HISTORY_LOAD_ERROR'
      });
    }
  });

  socket.on('send-message', async (data) => {
    console.log('💬 Message reçu:', data);

    try {
      const sendMessage: Message = await messageService.sendMessage({
        groupId: Number(data.groupId),
        content: data.content,
        senderId: Number(data.senderId),
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
      console.error('❌ Erreur lors de l\'envoi du message:', error);

      // Envoyer une erreur au client
      socket.emit('error', {
        message: 'Impossible d\'envoyer le message',
        type: 'MESSAGE_SEND_ERROR'
      });
    }

  });

  socket.on('disconnect', () => {
    console.log('❌ Utilisateur déconnecté:', socket.id);
  });
});

// Créer un registre pour Prometheus
const register = new client.Registry();

// Activer les métriques par défaut (RAM, CPU, etc.)
client.collectDefaultMetrics({ register });

// Exemple de compteur personnalisé
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status'] as const,
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5], // en secondes
});
register.registerMetric(httpRequestDuration);

const httpErrorCounter = new client.Counter({
  name: 'http_errors_total',
  help: 'Nombre total derreurs HTTP',
  labelNames: ['method', 'route', 'status'] as const,
});
register.registerMetric(httpErrorCounter);

// Enregistrer le compteur dans le registre
register.registerMetric(httpRequestCounter);

// Middleware de mesure + comptage
app.use((req: Request, res, next) => {
  const start = process.hrtime(); // temps de départ en haute résolution

  res.on('finish', () => {
    const delta = process.hrtime(start);
    const durationInSeconds = delta[0] + delta[1] / 1e9;

    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode.toString(),
    };

    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, durationInSeconds);

    // Si erreur (code 4xx ou 5xx), on l'enregistre
    if (res.statusCode >= 400) {
      httpErrorCounter.inc(labels);
    }
  });

  next();
});

// Route pour exposer les métriques
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end((err as Error).message);
  }
});

// IMPORTANT : Utiliser httpServer au lieu d'app.listen()
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🔌 Socket.IO configuré et prêt`);
  console.log(`📊 Métriques Prometheus disponibles sur /metrics`);
  console.log(`📖 Documentation Swagger disponible sur /swagger`);
});

// Exporter io pour l'utiliser ailleurs si nécessaire
export { io };