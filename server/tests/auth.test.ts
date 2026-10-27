import jwt from 'jsonwebtoken';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { api, auth, createUser, resetDb } from './helpers';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('GET /api/health', () => {
  it('is public and returns ok', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /api/auth/register', () => {
  const body = { fullName: 'ישראל ישראלי', email: 'Israel@Example.com', password: 'Password123!' };

  it('creates a regular user, lower-cases the email and never returns the password', async () => {
    const res = await api().post('/api/auth/register').send(body);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      fullName: 'ישראל ישראלי',
      email: 'israel@example.com',
      role: 'USER',
      isManager: false,
      restaurantId: null,
    });
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns { user, token } – the same shape as login – with a token that works immediately', async () => {
    const res = await api().post('/api/auth/register').send(body);
    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(['token', 'user']);
    expect(typeof res.body.token).toBe('string');

    const decoded = jwt.decode(res.body.token) as jwt.JwtPayload;
    expect(decoded.sub).toBe(res.body.user.id);
    expect(decoded.exp).toBeGreaterThan(decoded.iat!); // limited lifetime, like login

    const me = await api().get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user).toEqual(res.body.user);

    const login = await api().post('/api/auth/login').send({ email: body.email, password: body.password });
    expect(Object.keys(login.body).sort()).toEqual(Object.keys(res.body).sort());
    expect(Object.keys(login.body.user).sort()).toEqual(Object.keys(res.body.user).sort());
  });

  it('does not return a token when registration fails', async () => {
    await api().post('/api/auth/register').send(body);
    const dup = await api().post('/api/auth/register').send(body);
    expect(dup.status).toBe(409);
    expect(dup.body).not.toHaveProperty('token');
    const invalid = await api().post('/api/auth/register').send({ ...body, email: 'bad' });
    expect(invalid.status).toBe(400);
    expect(invalid.body).not.toHaveProperty('token');
  });

  it('stores a bcrypt hash, not the plain password', async () => {
    await api().post('/api/auth/register').send(body);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'israel@example.com' } });
    expect(user.passwordHash).not.toBe(body.password);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('returns 409 with a login suggestion for an existing email (case-insensitive)', async () => {
    await api().post('/api/auth/register').send(body);
    const res = await api()
      .post('/api/auth/register')
      .send({ ...body, email: '  ISRAEL@example.COM ' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
    expect(res.body.error.details).toEqual({ suggestion: 'login' });
  });

  it.each([
    ['missing fullName', { email: 'a@b.com', password: 'Password123!' }, 'fullName'],
    ['blank fullName', { fullName: '   ', email: 'a@b.com', password: 'Password123!' }, 'fullName'],
    ['missing email', { fullName: 'A', password: 'Password123!' }, 'email'],
    ['invalid email', { fullName: 'A', email: 'not-an-email', password: 'Password123!' }, 'email'],
    ['missing password', { fullName: 'A', email: 'a@b.com' }, 'password'],
    ['short password', { fullName: 'A', email: 'a@b.com', password: '123' }, 'password'],
  ])('returns 400 for %s', async (_name, payload, field) => {
    const res = await api().post('/api/auth/register').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toContain(field);
  });

  it('returns 400 for malformed JSON without leaking internals', async () => {
    const res = await api().post('/api/auth/register').set('Content-Type', 'application/json').send('{"bad json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.(js|ts)/);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token and the user without password on valid credentials', async () => {
    await api().post('/api/auth/register').send({ fullName: 'A', email: 'a@b.com', password: 'Password123!' });
    const res = await api().post('/api/auth/login').send({ email: 'A@B.com', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.email).toBe('a@b.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
    const decoded = jwt.decode(res.body.token) as jwt.JwtPayload;
    expect(decoded.sub).toBe(res.body.user.id);
    expect(decoded.exp).toBeGreaterThan(decoded.iat!); // limited lifetime
  });

  it('returns 401 for a wrong password', async () => {
    await api().post('/api/auth/register').send({ fullName: 'A', email: 'a@b.com', password: 'Password123!' });
    const res = await api().post('/api/auth/login').send({ email: 'a@b.com', password: 'WrongPass1!' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body).not.toHaveProperty('token');
  });

  it('returns 401 with the same message for an unknown email', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'nobody@b.com', password: 'Password123!' });
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
  });

  it('returns 400 when fields are missing', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with role USER', async () => {
    const u = await createUser('Me Myself');
    const res = await api().get('/api/auth/me').set(auth(u));
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: u.id, fullName: 'Me Myself', role: 'USER', isManager: false });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 without a token', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for a malformed header or garbage token', async () => {
    const u = await createUser();
    expect((await api().get('/api/auth/me').set('Authorization', u.token)).status).toBe(401);
    expect((await api().get('/api/auth/me').set('Authorization', `Basic ${u.token}`)).status).toBe(401);
    const res = await api().get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const u = await createUser();
    const forged = jwt.sign({}, 'some-other-secret-of-sufficient-length', { subject: u.id, expiresIn: '1h' });
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 for an unsigned (alg none) token', async () => {
    const u = await createUser();
    const none = jwt.sign({ sub: u.id }, '', { algorithm: 'none' });
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${none}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 TOKEN_EXPIRED for an expired token', async () => {
    const u = await createUser();
    const expired = jwt.sign(
      { exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET!,
      { subject: u.id },
    );
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('returns 401 when the user behind a valid token no longer exists', async () => {
    const u = await createUser();
    await prisma.user.delete({ where: { id: u.id } });
    const res = await api().get('/api/auth/me').set(auth(u));
    expect(res.status).toBe(401);
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404', async () => {
    const res = await api().get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
