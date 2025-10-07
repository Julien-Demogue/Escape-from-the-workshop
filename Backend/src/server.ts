import express, { Request, Response, NextFunction } from 'express';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import client from 'prom-client';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(routes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
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
  help: 'Nombre total d’erreurs HTTP',
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

    // Si erreur (code 4xx ou 5xx), on l’enregistre
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