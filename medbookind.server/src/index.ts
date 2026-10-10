import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { ensureDatabaseExists, getPool, runMigrations, verifyDatabaseConnection } from './db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import practiceRoutes from './routes/practice.js';
import locationRoutes from './routes/location.js';
import onboardingRoutes from './routes/onboarding.js';
import treatmentRoutes from './routes/treatmentConfig.js';
import paymentRoutes from './routes/payment.js';
import adminRoutes from './routes/admin.js';
import appointmentsRoutes from './routes/appointments.js';
import doctorRoutes from './routes/doctor.js';
import staffRoutes from './routes/staff.js';
import patientRoutes from './routes/patient.js';
import patientsRoutes from './routes/patients.js';
import practiceConfigRoutes from './routes/practiceConfig.js';
import consultationsRoutes from './routes/consultations.js';
import notificationsRoutes from './routes/notifications.js';
import exportRoutes from './routes/export.js';

const port = Number(process.env.PORT ?? 5000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'https://localhost:5173';

function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (origin === clientOrigin) return true;
  const extra = (process.env.CLIENT_ORIGIN_EXTRA ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (extra.includes(origin)) return true;
  // Dev: Vite may move to 5174+ if 5173 is taken (HTTPS localhost)
  if (/^https:\/\/localhost:\d+$/.test(origin)) return true;
  return false;
}

async function seedDemoUser(): Promise<void> {
  const pool = getPool();
  const email = 'admin@medbook.local';
  const exists = await pool.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
  if (exists.rows.length > 0) return;
  const id = randomUUID();
  const password_hash = await bcrypt.hash('Admin123!', 10);
  await pool.query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_onboarded)
     VALUES ($1, $2, $3, 'Admin', 'User', '', 'Admin', false)`,
    [id, email, password_hash]
  );
  console.log(`Seeded demo user: ${email} / Admin123!`);
}

async function main(): Promise<void> {
  await ensureDatabaseExists();
  await verifyDatabaseConnection();
  await runMigrations();
  await seedDemoUser();

  const app = express();
  app.use(
    cors({
      origin: (origin, cb) => cb(null, isAllowedCorsOrigin(origin)),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'medbookind-server' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/user', usersRoutes);
  app.use('/api/practice', practiceRoutes);
  app.use('/api/location', locationRoutes);
  app.use('/api/Onboarding', onboardingRoutes);
  app.use('/api/TreamentConfig', treatmentRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/doctor', doctorRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/patient', patientRoutes);
  app.use('/api/patients', patientsRoutes);
  app.use('/api/practice-config', practiceConfigRoutes);
  app.use('/api/consultations', consultationsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/export', exportRoutes);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  // Express 4: catch async route errors so DB timeouts return JSON instead of crashing
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('API error:', err);
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ENETUNREACH') {
        res.status(503).json({
          message: 'Database unavailable. Check DATABASE_URL / start local Postgres (npm run db:up).',
        });
        return;
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  );

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection (kept process alive):', reason);
  });

  app.listen(port, () => {
    console.log(`MedBookInd API listening on http://localhost:${port}`);
    console.log(`CORS origin: ${clientOrigin}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
