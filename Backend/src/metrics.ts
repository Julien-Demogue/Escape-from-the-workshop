import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

/*
  metrics.ts
  - Creates and exports a Prometheus registry
  - Enables default metrics collection
  - Defines custom HTTP counters/histogram
  - Exports an Express middleware to measure request counts and durations
  - Exports a /metrics handler to expose metrics
*/

// Create a registry for Prometheus
export const register = new client.Registry();

// Enable default metrics (memory, CPU, etc.)
client.collectDefaultMetrics({ register });

// Example custom HTTP request counter
export const httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'] as const,
});

// Histogram for request durations (seconds)
export const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

// Counter for HTTP errors
export const httpErrorCounter = new client.Counter({
    name: 'http_errors_total',
    help: 'Total number of HTTP errors',
    labelNames: ['method', 'route', 'status'] as const,
});

// Register custom metrics
register.registerMetric(httpRequestCounter);
register.registerMetric(httpRequestDuration);
register.registerMetric(httpErrorCounter);

// Express middleware to measure request counts and durations
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();

    res.on('finish', () => {
        const delta = process.hrtime(start);
        const durationInSeconds = delta[0] + delta[1] / 1e9;

        const labels = {
            method: req.method,
            route: (req.route && (req.route as any).path) || req.path,
            status: res.statusCode.toString(),
        };

        httpRequestCounter.inc(labels);
        httpRequestDuration.observe(labels, durationInSeconds);

        // If error (4xx or 5xx), increment error counter
        if (res.statusCode >= 400) {
            httpErrorCounter.inc(labels);
        }
    });

    next();
};

// Handler to expose Prometheus metrics
export const metricsHandler = async (req: Request, res: Response) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end((err as Error).message);
    }
};
