import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-jwt-secret-for-auth-suite-only';

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock('../src/db.js', () => ({
  getPool: () => ({
    query: queryMock,
    connect: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
  }),
}));

import { createAuthTestApp } from './helpers/createAuthTestApp.js';
import { signToken } from '../src/jwt.js';

const TEST_USER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'tester@example.local',
  first_name: 'Test',
  last_name: 'User',
  phone: '',
  role: 'Admin',
  is_onboarded: false,
  practice_id: null,
  email_verified: true,
  phone_verified: false,
  password: 'CorrectPass123!',
};

let passwordHash: string;
const app = createAuthTestApp();

function assertNoSensitiveLeak(body: unknown) {
  const serialized = JSON.stringify(body);
  expect(serialized).not.toMatch(/password_hash/i);
  expect(serialized).not.toMatch(/"password"\s*:/);
  expect(serialized).not.toContain(TEST_USER.password);
  expect(serialized).not.toContain(passwordHash);
}

describe('Authentication API', () => {
  beforeAll(async () => {
    passwordHash = await bcrypt.hash(TEST_USER.password, 10);
  });

  beforeEach(() => {
    queryMock.mockReset();
  });

  describe('POST /api/auth/login', () => {
    it('returns 200, JWT, and user for valid credentials', async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ ...TEST_USER, password_hash: passwordHash }],
      });

      const res = await request(app).post('/api/auth/login').send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user).toMatchObject({
        id: TEST_USER.id,
        email: TEST_USER.email,
        firstName: TEST_USER.first_name,
        lastName: TEST_USER.last_name,
        role: TEST_USER.role,
        isOnboarded: TEST_USER.is_onboarded,
      });
      assertNoSensitiveLeak(res.body);

      const payload = jwt.verify(res.body.token, process.env.JWT_SECRET!) as {
        sub: string;
        email: string;
        role: string;
      };
      expect(payload.sub).toBe(TEST_USER.id);
      expect(payload.email).toBe(TEST_USER.email);
      expect(payload.role).toBe(TEST_USER.role);

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('FROM users WHERE email = $1'),
        [TEST_USER.email]
      );
    });

    it('normalizes email case/whitespace for lookup', async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ ...TEST_USER, password_hash: passwordHash }],
      });

      const res = await request(app).post('/api/auth/login').send({
        email: '  Tester@Example.Local ',
        password: TEST_USER.password,
      });

      expect(res.status).toBe(200);
      expect(queryMock.mock.calls[0][1]).toEqual(['tester@example.local']);
    });

    it('returns 400 when email and password are missing', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Email and password required' });
      expect(queryMock).not.toHaveBeenCalled();
      assertNoSensitiveLeak(res.body);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: TEST_USER.email,
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Email and password required' });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({
        password: TEST_USER.password,
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Email and password required' });
    });

    it('returns 401 for unknown email without revealing whether the account exists', async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.local',
        password: 'AnyPassword1!',
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Invalid email or password' });
      expect(res.body.message).not.toMatch(/not found|does not exist|unknown/i);
      assertNoSensitiveLeak(res.body);
    });

    it('returns 401 for incorrect password without leaking hashes or secrets', async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ ...TEST_USER, password_hash: passwordHash }],
      });

      const res = await request(app).post('/api/auth/login').send({
        email: TEST_USER.email,
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Invalid email or password' });
      expect(res.body).not.toHaveProperty('token');
      assertNoSensitiveLeak(res.body);
    });
  });

  describe('Protected route GET /api/auth/me (JWT middleware)', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Unauthorized' });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('returns 401 for an invalid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-valid-jwt');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Invalid token' });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('returns 401 for a JWT signed with the wrong secret', async () => {
      const badToken = jwt.sign(
        { sub: TEST_USER.id, email: TEST_USER.email, role: TEST_USER.role },
        'different-secret',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${badToken}`);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Invalid token' });
    });

    it('returns 200 and user profile for a valid JWT', async () => {
      const token = signToken({
        sub: TEST_USER.id,
        email: TEST_USER.email,
        role: TEST_USER.role,
      });

      queryMock.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_USER.id,
            email: TEST_USER.email,
            first_name: TEST_USER.first_name,
            last_name: TEST_USER.last_name,
            phone: TEST_USER.phone,
            role: TEST_USER.role,
            is_onboarded: TEST_USER.is_onboarded,
            practice_id: TEST_USER.practice_id,
            email_verified: TEST_USER.email_verified,
            phone_verified: TEST_USER.phone_verified,
          },
        ],
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: TEST_USER.id,
        email: TEST_USER.email,
        role: TEST_USER.role,
        firstName: TEST_USER.first_name,
        lastName: TEST_USER.last_name,
      });
      assertNoSensitiveLeak(res.body);
    });
  });

  describe('POST /api/auth/validate-token', () => {
    it('returns 401 { valid: false } when token is missing', async () => {
      const res = await request(app).post('/api/auth/validate-token').send({});

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ valid: false });
    });

    it('returns 401 { valid: false } for an invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/validate-token')
        .send({ token: 'garbage.token.value' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ valid: false });
    });

    it('returns 200 { valid: true } for a valid Bearer token', async () => {
      const token = signToken({
        sub: TEST_USER.id,
        email: TEST_USER.email,
        role: 'Doctor',
      });

      const res = await request(app)
        .post('/api/auth/validate-token')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ valid: true });
    });
  });
});
