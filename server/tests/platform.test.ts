import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { openApiDocument } from '../src/docs/openapi';
import { api, auth, createUser, resetDb } from './helpers';

beforeEach(resetDb);
afterEach(() => vi.restoreAllMocks());
afterAll(() => prisma.$disconnect());

describe('unexpected errors (500)', () => {
  it('returns a generic message without stack trace, SQL or secrets', async () => {
    const user = await createUser();
    const secret = process.env.JWT_SECRET!;
    vi.spyOn(prisma.restaurant, 'findMany').mockRejectedValueOnce(
      new Error(`connection to postgresql://restaurant:restaurant@db failed; secret=${secret}`),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {}); // server-side log only

    const res = await api().get('/api/restaurants').set(auth(user));
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain(secret);
    expect(raw).not.toContain('postgresql://');
    expect(raw).not.toMatch(/\bat .+:\d+:\d+/); // stack frame
  });
});

describe('CORS', () => {
  it('allows the configured client origin, including the Authorization header', async () => {
    const res = await api()
      .options('/api/restaurants')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'authorization,content-type');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-headers']).toMatch(/authorization/i);
    expect(res.headers['access-control-allow-methods']).toMatch(/PATCH/);
  });

  it('does not allow unknown origins', async () => {
    const res = await api().get('/api/health').set('Origin', 'https://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('API documentation', () => {
  it('serves Swagger UI at /api-docs', async () => {
    const res = await api().get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toMatch(/swagger/i);
  });

  it('serves the OpenAPI document with Bearer JWT security and every route', async () => {
    const res = await api().get('/api-docs/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
    const ops = Object.entries(res.body.paths as Record<string, Record<string, unknown>>).flatMap(([path, item]) =>
      Object.keys(item)
        .filter((k) => k !== 'parameters')
        .map((m) => `${m.toUpperCase()} ${path}`),
    );
    expect(ops.sort()).toEqual(
      [
        'GET /api/health',
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/me',
        'GET /api/restaurants',
        'POST /api/restaurants',
        'GET /api/restaurants/{id}',
        'PATCH /api/restaurants/{id}',
        'PUT /api/restaurants/{id}/table-groups',
        'PATCH /api/restaurants/{id}/table-groups/{groupId}',
      ].sort(),
    );
    // public routes opt out of the global bearer requirement
    for (const p of ['/api/health', '/api/auth/register', '/api/auth/login']) {
      const op = Object.values(res.body.paths[p])[0] as { security: unknown[] };
      expect(op.security).toEqual([]);
    }
  });

  it('the committed openapi.json is in sync with the code (run `npm run openapi:export`)', () => {
    const file = JSON.parse(readFileSync(resolve(__dirname, '..', 'openapi.json'), 'utf8'));
    expect(file).toEqual(JSON.parse(JSON.stringify(openApiDocument)));
  });
});
