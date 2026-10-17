import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { corsOrigins } from './config/env';
import { openApiDocument } from './docs/openapi';
import { authRouter } from './modules/auth/auth.routes';
import { restaurantRouter } from './modules/restaurants/restaurant.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Render (and most PaaS) terminate TLS at a proxy.
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: corsOrigins.includes('*') ? true : corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/restaurants', restaurantRouter);

  // API documentation
  app.get(['/api-docs/openapi.json', '/openapi.json'], (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: 'Restaurant Occupancy API' }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
