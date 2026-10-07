import request from 'supertest';
import app from '../src/app.js';
import { sequelize } from '../src/models/index.js';
import { PASSWORD, bearer, createAdminSession, createMarketerSession, resetDb } from './helpers.js';

beforeEach(resetDb);
afterAll(() => sequelize.close());

const cookieOf = (res) => res.headers['set-cookie']?.find((c) => c.startsWith('refreshToken='));

describe('registration', () => {
  it('bootstraps the first user as admin even if a role is not given, and never leaks the hash', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'First', email: 'First@DME.test', password: PASSWORD, role: 'marketer' });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: 'first@dme.test', role: 'admin' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('requires an admin once a user exists', async () => {
    const { token } = await createAdminSession();
    await request(app).post('/api/auth/register').send({ name: 'X', email: 'x@dme.test', password: PASSWORD }).expect(401);
    const { token: marketerToken } = await createMarketerSession(token);
    await request(app).post('/api/auth/register').set(bearer(marketerToken)).send({ name: 'Y', email: 'y@dme.test', password: PASSWORD }).expect(403);
  });

  it('rejects weak passwords and duplicate emails', async () => {
    const weak = await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@dme.test', password: 'short' });
    expect(weak.status).toBe(422);
    expect(weak.body.error.code).toBe('VALIDATION_ERROR');

    const { token } = await createAdminSession();
    const dup = await request(app).post('/api/auth/register').set(bearer(token)).send({ name: 'A', email: 'admin@dme.test', password: PASSWORD });
    expect(dup.status).toBe(409);
  });
});

describe('login & cookies', () => {
  it('returns an access token in JSON and the refresh token only in an HttpOnly SameSite cookie', async () => {
    await createAdminSession();
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@dme.test', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(JSON.stringify(res.body)).not.toContain('refreshToken');
    const cookie = cookieOf(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/auth/);
  });

  it('gives the same generic error for wrong password and unknown email', async () => {
    await createAdminSession();
    const a = await request(app).post('/api/auth/login').send({ email: 'admin@dme.test', password: 'wrong-password1' });
    const b = await request(app).post('/api/auth/login').send({ email: 'nobody@dme.test', password: 'wrong-password1' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error.message).toBe(b.body.error.message);
  });

  it('protects /me and accepts a valid bearer token', async () => {
    const { token } = await createAdminSession();
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/auth/me').set(bearer('garbage')).expect(401);
    const res = await request(app).get('/api/auth/me').set(bearer(token)).expect(200);
    expect(res.body.data.user.email).toBe('admin@dme.test');
  });

  it('immediately rejects tokens of deactivated users', async () => {
    const { token, user } = await createAdminSession();
    const { User } = await import('../src/models/index.js');
    await User.update({ isActive: false }, { where: { id: user.id } });
    await request(app).get('/api/auth/me').set(bearer(token)).expect(401);
  });
});

describe('refresh token rotation', () => {
  it('rotates on refresh and detects reuse of an old token (revoking the whole family)', async () => {
    await createAdminSession();
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@dme.test', password: PASSWORD });
    const first = cookieOf(login).split(';')[0];

    const r1 = await request(app).post('/api/auth/refresh').set('Cookie', first).expect(200);
    const second = cookieOf(r1).split(';')[0];
    expect(second).not.toBe(first);
    expect(r1.body.data.accessToken).toEqual(expect.any(String));

    // replaying the already-used token => reuse detected
    const replay = await request(app).post('/api/auth/refresh').set('Cookie', first);
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('REFRESH_TOKEN_REUSED');

    // the newer token from the same family is now dead too
    await request(app).post('/api/auth/refresh').set('Cookie', second).expect(401);
  });

  it('rejects a missing or forged refresh cookie', async () => {
    await request(app).post('/api/auth/refresh').expect(401);
    await request(app).post('/api/auth/refresh').set('Cookie', 'refreshToken=abc.def.ghi').expect(401);
  });

  it('logout revokes the refresh token and clears the cookie', async () => {
    await createAdminSession();
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@dme.test', password: PASSWORD });
    const cookie = cookieOf(login).split(';')[0];
    const out = await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(204);
    expect(cookieOf(out)).toMatch(/refreshToken=;/);
    await request(app).post('/api/auth/refresh').set('Cookie', cookie).expect(401);
  });
});
