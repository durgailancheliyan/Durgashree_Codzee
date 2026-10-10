import express from 'express';
import authRoutes from '../../src/routes/auth.js';

/** Minimal Express app mounting only auth routes (no real DB, no listen). */
export function createAuthTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ENETUNREACH') {
        res.status(503).json({ message: 'Database unavailable' });
        return;
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  );

  return app;
}
